"use strict";

/**
 * 지정한 시간만큼 기다립니다.
 * @param {number} milliseconds 기다릴 시간(밀리초)
 * @returns {Promise<void>} 기다린 뒤 완료됩니다.
 */
function wait(milliseconds) {
  // 타이머가 끝나면 기다리는 작업을 완료합니다.
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * 촬영 전에 5초 숫자를 보여 주고 사진 찍는 순간을 알립니다.
 * @param {HTMLElement} countdown 숫자를 표시할 요소
 * @param {HTMLElement} status 진행 안내를 표시할 요소
 * @returns {Promise<void>} 카운트다운이 끝나면 완료됩니다.
 */
async function runCountdown(countdown, status) {
  countdown.classList.remove("hidden");

  for (var seconds = 5; seconds > 0; seconds -= 1) {
    countdown.textContent = String(seconds);
    status.textContent = "촬영까지 " + seconds + "초 남았습니다.";
    await wait(1000);
  }

  countdown.textContent = "찰칵!";
  status.textContent = "사진을 찍었어요!";
  await wait(250);
  countdown.classList.add("hidden");
}

/**
 * 카메라 오류를 사용자가 이해하기 쉬운 안내 문구로 바꿉니다.
 * @param {Error} error 카메라 연결 또는 촬영 중 발생한 오류
 * @returns {string} 화면에 표시할 한국어 안내
 */
function getCameraErrorMessage(error) {
  if (error && error.name === "NotAllowedError") {
    return "카메라 권한이 필요하거나 안전하지 않은 연결일 수 있어요. 권한을 허용하고 HTTPS 또는 내 PC에서 연 파일에서 다시 시도해 주세요.";
  }

  if (error && error.name === "NotFoundError") {
    return "사용할 수 있는 카메라를 찾지 못했어요. 카메라가 연결되어 있는지 확인해 주세요.";
  }

  if (error && error.name === "NotReadableError") {
    return "카메라를 다른 앱에서 사용 중일 수 있어요. 다른 앱을 닫고 다시 시도해 주세요.";
  }

  if (error && error.name === "SecurityError") {
    return "카메라는 HTTPS 또는 내 PC에서 연 파일에서 사용할 수 있어요.";
  }

  if (error && error.message && /[가-힣]/.test(error.message)) {
    return error.message;
  }

  return "카메라를 사용할 수 없어요. 권한을 허용하고 HTTPS 또는 내 PC에서 연 파일에서 다시 시도해 주세요.";
}

/**
 * 촬영 화면에 찍은 사진의 작은 미리보기를 추가합니다.
 * @param {HTMLCanvasElement} shot 방금 찍은 사진
 * @param {number} shotNumber 사진 순서
 * @param {HTMLElement} previewList 미리보기를 담을 화면 요소
 * @returns {void} 화면을 갱신하고 돌려주는 값은 없습니다.
 */
function addShotPreview(shot, shotNumber, previewList) {
  var item = document.createElement("div");
  item.id = "shot-preview-" + shotNumber;
  item.className = "shot-preview-item";

  var image = document.createElement("img");
  image.id = "shot-preview-image-" + shotNumber;
  image.className = "shot-preview-image";
  image.alt = shotNumber + "번째 촬영 사진";
  image.src = shot.toDataURL("image/jpeg", 0.82);

  var number = document.createElement("span");
  number.id = "shot-preview-number-" + shotNumber;
  number.className = "shot-preview-number";
  number.textContent = String(shotNumber);

  item.appendChild(image);
  item.appendChild(number);
  previewList.appendChild(item);
}

/**
 * 촬영한 사진과 선택 상태를 초기화합니다.
 * @param {HTMLElement} previewList 사진 미리보기 목록
 * @param {HTMLElement} progressCount 진행 수 표시
 * @param {number} cutCount 선택한 컷 수
 * @returns {void} 촬영 화면을 초기 상태로 되돌립니다.
 */
function resetCaptureState(previewList, progressCount, cutCount) {
  previewList.replaceChildren();
  progressCount.textContent = "0 / " + cutCount;
}

/**
 * 화면 버튼과 기능을 연결해 컷 선택, 연속 촬영, 결과 확인 흐름을 시작합니다.
 * @returns {void} 화면 동작을 연결하고 돌려주는 값은 없습니다.
 */
function initApp() {
  var selectionScreen = document.getElementById("selection-screen");
  var captureScreen = document.getElementById("capture-screen");
  var resultScreen = document.getElementById("result-screen");
  var selectTwoButton = document.getElementById("select-two-button");
  var selectFourButton = document.getElementById("select-four-button");
  var selectedCountLabel = document.getElementById("selected-count");
  var selectionStatus = document.getElementById("selection-status");
  var video = document.getElementById("camera-video");
  var countdown = document.getElementById("countdown");
  var placeholder = document.getElementById("camera-placeholder");
  var progressCount = document.getElementById("progress-count");
  var previewCount = document.getElementById("preview-count");
  var previewList = document.getElementById("shot-previews");
  var cameraStatus = document.getElementById("camera-status");
  var startButton = document.getElementById("start-capture-button");
  var backButton = document.getElementById("back-to-selection-button");
  var resultStatus = document.getElementById("result-status");
  var frameElement = document.getElementById("final-frame");
  var filtersContainer = document.getElementById("filters");
  var restartButton = document.getElementById("restart-button");
  var state = {
    shots: [],
    filter: "original",
    cutCount: 0
  };
  var isCapturing = false;

  /**
   * 원본 사진마다 새 필터 캔버스를 만들고 다시 세로 프레임으로 합칩니다.
   * @returns {void} 결과 캔버스를 갱신합니다.
   */
  function renderResult() {
    if (state.shots.length !== state.cutCount) {
      throw new Error("촬영한 사진이 모두 준비되지 않았어요.");
    }

    // 매번 원본 사진 각각에서 새 필터 사진을 만듭니다.
    var filteredShots = state.shots.map(function (shot) {
      return applyFilter(shot, state.filter);
    });
    var strip = makeStrip(filteredShots);
    var context = frameElement.getContext("2d");
    if (!context) {
      throw new Error("완성된 사진을 화면에 표시하지 못했습니다.");
    }

    frameElement.width = strip.width;
    frameElement.height = strip.height;
    context.drawImage(strip, 0, 0);
  }

  /**
   * 필터 목록을 읽어 결과 화면의 필터 버튼을 자동으로 만듭니다.
   * @returns {void} 필터 버튼을 화면에 추가합니다.
   */
  function createFilterButtons() {
    FILTERS.forEach(function (filter) {
      var button = document.createElement("button");
      button.id = "filter-button-" + filter.name;
      button.type = "button";
      button.className = "filter-btn";
      button.textContent = filter.label;
      button.setAttribute("aria-pressed", "false");

      // 선택한 필터 이름을 상태에 저장하고 원본 사진으로 결과를 다시 만듭니다.
      button.addEventListener("click", function () {
        state.filter = filter.name;

        // 선택된 버튼만 진한 색으로 표시하고 보조 읽기 상태도 갱신합니다.
        Array.prototype.forEach.call(
          filtersContainer.querySelectorAll(".filter-btn"),
          function (filterButton) {
            var isSelected = filterButton === button;
            filterButton.classList.toggle("active", isSelected);
            filterButton.setAttribute("aria-pressed", String(isSelected));
          }
        );

        try {
          renderResult();
          resultStatus.textContent = filter.label + " 필터를 적용했어요.";
        } catch (error) {
          console.error("필터 적용에 실패했습니다.", error);
          resultStatus.textContent = error.message
            || "필터를 적용하지 못했어요. 다른 필터를 선택해 주세요.";
        }
      });

      filtersContainer.appendChild(button);
    });
  }

  // 선택한 컷 수를 기억하고 촬영 화면으로 이동합니다.
  function chooseCutCount(cutCount) {
    state.cutCount = cutCount;
    state.shots = [];
    state.filter = "original";
    selectedCountLabel.textContent = cutCount + "컷 촬영";
    progressCount.textContent = "0 / " + cutCount;
    selectTwoButton.setAttribute("aria-pressed", String(cutCount === 2));
    selectFourButton.setAttribute("aria-pressed", String(cutCount === 4));
    selectionStatus.textContent = cutCount + "컷을 선택했어요.";
    cameraStatus.textContent = "시작 버튼을 누르면 " + cutCount + "번 자동으로 촬영합니다.";
    startButton.textContent = "촬영 시작";
    previewCount.textContent = "0장";
    resetCaptureState(previewList, progressCount, cutCount);
    selectionScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    captureScreen.classList.remove("hidden");
    placeholder.classList.remove("hidden");
    video.classList.add("hidden");
  }

  // 2컷 또는 4컷을 선택하면 선택한 수로 촬영을 준비합니다.
  selectTwoButton.addEventListener("click", function () {
    chooseCutCount(2);
  });
  selectFourButton.addEventListener("click", function () {
    chooseCutCount(4);
  });

  // 페이지를 준비할 때 필터 목록을 읽어 버튼을 자동으로 만듭니다.
  createFilterButtons();

  // 촬영 시작 버튼 한 번으로 선택한 수만큼 촬영을 자동으로 진행합니다.
  startButton.addEventListener("click", async function () {
    if (isCapturing || (state.cutCount !== 2 && state.cutCount !== 4)) {
      return;
    }

    isCapturing = true;
    startButton.disabled = true;
    backButton.disabled = true;
    state.shots = [];
    state.filter = "original";
    resetCaptureState(previewList, progressCount, state.cutCount);
    previewCount.textContent = "0장";
    countdown.classList.add("hidden");
    cameraStatus.textContent = "카메라를 연결하고 있어요.";

    try {
      await startCamera(video);
      placeholder.classList.add("hidden");

      for (var index = 0; index < state.cutCount; index += 1) {
        var shotNumber = index + 1;
        progressCount.textContent = shotNumber + " / " + state.cutCount;
        cameraStatus.textContent = shotNumber + "번째 사진을 준비하고 있어요.";
        await runCountdown(countdown, cameraStatus);

        var shot = await captureShot(video);
        state.shots.push(shot);
        addShotPreview(shot, shotNumber, previewList);
        previewCount.textContent = state.shots.length + "장";

        if (shotNumber < state.cutCount) {
          cameraStatus.textContent = "다음 사진을 준비하고 있어요.";
          await wait(700);
        }
      }

      stopCamera(video);
      video.classList.add("hidden");
      cameraStatus.textContent = "모든 사진을 찍었어요. 프레임을 만들고 있어요.";
      renderResult();
      // 결과에 처음부터 원본 필터가 선택된 것으로 표시합니다.
      Array.prototype.forEach.call(
        filtersContainer.querySelectorAll(".filter-btn"),
        function (filterButton) {
          var isOriginal = filterButton.id === "filter-button-original";
          filterButton.classList.toggle("active", isOriginal);
          filterButton.setAttribute("aria-pressed", String(isOriginal));
        }
      );
      captureScreen.classList.add("hidden");
      resultScreen.classList.remove("hidden");
      resultStatus.textContent = state.cutCount + "장의 사진으로 프레임을 만들었어요.";
    } catch (error) {
      console.error("연속 촬영에 실패했습니다.", error);
      stopCamera(video);
      video.classList.add("hidden");
      placeholder.classList.remove("hidden");
      countdown.classList.add("hidden");
      cameraStatus.textContent = getCameraErrorMessage(error)
        + " 다시 촬영하거나 컷 수를 다시 골라 주세요.";
      progressCount.textContent = state.shots.length + " / " + state.cutCount;
      startButton.textContent = "다시 촬영하기";
    } finally {
      isCapturing = false;
      startButton.disabled = false;
      backButton.disabled = false;
    }
  });

  // 촬영을 진행하지 않을 때 컷 수 선택 화면으로 돌아갑니다.
  backButton.addEventListener("click", function () {
    if (isCapturing) {
      return;
    }

    stopCamera(video);
    video.classList.add("hidden");
    countdown.classList.add("hidden");
    captureScreen.classList.add("hidden");
    selectionScreen.classList.remove("hidden");
    selectTwoButton.setAttribute("aria-pressed", "false");
    selectFourButton.setAttribute("aria-pressed", "false");
    state.cutCount = 0;
  });

  // 처음으로 버튼을 누르면 컷 선택부터 새로 시작합니다.
  restartButton.addEventListener("click", function () {
    stopCamera(video);
    video.classList.add("hidden");
    countdown.classList.add("hidden");
    captureScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    selectionScreen.classList.remove("hidden");
    selectTwoButton.setAttribute("aria-pressed", "false");
    selectFourButton.setAttribute("aria-pressed", "false");
    state.cutCount = 0;
    state.shots = [];
    state.filter = "original";
    // 처음 화면으로 돌아가면 필터의 선택 표시도 모두 지웁니다.
    Array.prototype.forEach.call(
      filtersContainer.querySelectorAll(".filter-btn"),
      function (filterButton) {
        filterButton.classList.remove("active");
        filterButton.setAttribute("aria-pressed", "false");
      }
    );
    frameElement.width = 0;
    frameElement.height = 0;
    previewList.replaceChildren();
    previewCount.textContent = "0장";
    progressCount.textContent = "0 / 4";
    startButton.textContent = "촬영 시작";
    cameraStatus.textContent = "시작 버튼을 누르면 선택한 수만큼 자동으로 촬영합니다.";
  });
}

// HTML 요소가 준비된 뒤 화면 버튼을 연결합니다.
document.addEventListener("DOMContentLoaded", initApp);
