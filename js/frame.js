"use strict";

/**
 * 사진들을 위에서부터 4:3 비율로 놓고 이름과 오늘 날짜를 넣은 세로 프레임을 만듭니다.
 * @param {HTMLCanvasElement[]} shots 촬영한 사진 목록
 * @returns {HTMLCanvasElement} 완성된 흰 바탕 세로 프레임
 */
function makeStrip(shots) {
  if (!Array.isArray(shots) || (shots.length !== 2 && shots.length !== 4)) {
    throw new Error("세로 프레임은 2장 또는 4장의 사진이 필요합니다.");
  }

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  if (!context) {
    throw new Error("사진 프레임을 만들지 못했습니다. 다시 시도해 주세요.");
  }

  var frameWidth = 720;
  var sidePadding = 42;
  var photoWidth = frameWidth - sidePadding * 2;
  var photoHeight = photoWidth * 3 / 4;
  var photoGap = 22;
  var topPadding = 42;
  var footerHeight = 142;

  canvas.width = frameWidth;
  canvas.height = topPadding + shots.length * photoHeight
    + (shots.length - 1) * photoGap + footerHeight;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 각 사진을 4:3 비율에 맞춰 자르고 위에서부터 차례로 배치합니다.
  shots.forEach(function (shot, index) {
    if (!shot || shot.width <= 0 || shot.height <= 0) {
      throw new Error((index + 1) + "번째 사진을 프레임에 넣을 수 없습니다.");
    }

    var sourceRatio = shot.width / shot.height;
    var targetRatio = photoWidth / photoHeight;
    var sourceX = 0;
    var sourceY = 0;
    var sourceWidth = shot.width;
    var sourceHeight = shot.height;

    if (sourceRatio > targetRatio) {
      sourceWidth = shot.height * targetRatio;
      sourceX = (shot.width - sourceWidth) / 2;
    } else {
      sourceHeight = shot.width / targetRatio;
      sourceY = (shot.height - sourceHeight) / 2;
    }

    var destinationY = topPadding + index * (photoHeight + photoGap);
    context.drawImage(
      shot,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      sidePadding,
      destinationY,
      photoWidth,
      photoHeight
    );
  });

  // 사진 아래에 서비스 이름과 기기의 오늘 날짜를 적습니다.
  var footerTop = topPadding + shots.length * photoHeight
    + (shots.length - 1) * photoGap;
  var today = new Date();
  var dateText = today.getFullYear() + "."
    + String(today.getMonth() + 1).padStart(2, "0") + "."
    + String(today.getDate()).padStart(2, "0");

  context.fillStyle = "#302b28";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 30px 'Noto Sans KR', sans-serif";
  context.fillText("인생네컷", frameWidth / 2, footerTop + 51);
  context.fillStyle = "#8b7b70";
  context.font = "500 18px 'Noto Sans KR', sans-serif";
  context.fillText(dateText, frameWidth / 2, footerTop + 91);

  return canvas;
}
