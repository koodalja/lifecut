"use strict";

/**
 * 카메라를 켜고 영상을 화면에 연결합니다.
 * @param {HTMLVideoElement} video 카메라 영상이 표시될 요소
 * @returns {Promise<MediaStream>} 연결된 카메라 영상
 */
async function startCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("이 브라우저에서는 카메라를 사용할 수 없습니다. 최신 브라우저로 다시 열어 주세요.");
  }

  var stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  video.srcObject = stream;
  video.classList.remove("hidden");

  try {
    await video.play();
  } catch (error) {
    stopCamera(video);
    throw error;
  }

  await waitForVideoReady(video);
  return stream;
}

/**
 * 영상 크기가 준비될 때까지 기다려 검은 화면 촬영을 막습니다.
 * @param {HTMLVideoElement} video 준비 상태를 확인할 요소
 * @returns {Promise<void>} 영상 준비가 끝나면 완료됩니다.
 */
function waitForVideoReady(video) {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }

  // 영상 준비 이벤트를 기다리거나 제한 시간을 넘기면 오류를 돌려줍니다.
  return new Promise(function (resolve, reject) {
    var timeoutId = window.setTimeout(function () {
      cleanUp();
      reject(new Error("카메라 영상 준비가 늦어지고 있어요. 다시 촬영해 주세요."));
    }, 8000);

    // 기다림이 끝나면 타이머와 영상 이벤트를 정리합니다.
    function cleanUp() {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", checkReady);
      video.removeEventListener("error", handleError);
    }

    // 영상 크기가 준비되었는지 확인합니다.
    function checkReady() {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanUp();
        resolve();
      }
    }

    // 영상 요소에서 오류가 나면 기다림을 끝냅니다.
    function handleError() {
      cleanUp();
      reject(new Error("카메라 영상을 불러오지 못했습니다."));
    }

    video.addEventListener("loadeddata", checkReady);
    video.addEventListener("error", handleError);
    checkReady();
  });
}

/**
 * 카메라 영상에서 사진 한 장을 캡처합니다.
 * @param {HTMLVideoElement} video 촬영 중인 카메라 영상 요소
 * @returns {Promise<HTMLCanvasElement>} 촬영한 사진
 */
async function captureShot(video) {
  await waitForVideoReady(video);

  var canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  var context = canvas.getContext("2d");
  if (!context) {
    throw new Error("사진을 만들지 못했습니다. 다시 시도해 주세요.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * 사용이 끝난 카메라를 꺼 브라우저가 영상 접근을 계속하지 않게 합니다.
 * @param {HTMLVideoElement} video 카메라 영상 요소
 * @returns {void} 돌려주는 값이 없습니다.
 */
function stopCamera(video) {
  var stream = video.srcObject;
  if (stream && typeof stream.getTracks === "function") {
    // 연결된 카메라 트랙을 모두 종료합니다.
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
  }

  video.srcObject = null;
}
