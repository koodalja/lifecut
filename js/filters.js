"use strict";

/**
 * 색 밝기 값을 0에서 255 사이로 제한합니다.
 * @param {number} value 조정할 색 밝기 값
 * @returns {number} 반올림한 0~255 밝기 값
 */
function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * 사진의 색을 바꾸는 필터 목록입니다.
 * 각 필터는 내부 이름, 화면에 보일 이름, 빨강·초록·파랑 계산 방법을 가집니다.
 * @type {{name: string, label: string, apply: function(number, number, number): {r: number, g: number, b: number}}[]}
 */
var FILTERS = [
  {
    name: "original",
    label: "원본",
    apply: function (red, green, blue) {
      // 원래의 빨강·초록·파랑 값을 그대로 돌려줍니다.
      return { r: red, g: green, b: blue };
    }
  },
  {
    name: "grayscale",
    label: "흑백",
    apply: function (red, green, blue) {
      // 눈이 느끼는 색 밝기 비율로 회색 값을 계산합니다.
      var gray = 0.299 * red + 0.587 * green + 0.114 * blue;
      return { r: gray, g: gray, b: gray };
    }
  },
  {
    name: "sepia",
    label: "세피아",
    apply: function (red, green, blue) {
      // 널리 쓰이는 세피아 색상 계산 계수를 적용합니다.
      return {
        r: 0.393 * red + 0.769 * green + 0.189 * blue,
        g: 0.349 * red + 0.686 * green + 0.168 * blue,
        b: 0.272 * red + 0.534 * green + 0.131 * blue
      };
    }
  },
  {
    name: "warm",
    label: "따뜻하게",
    apply: function (red, green, blue) {
      // 붉고 노란 기운을 더해 따뜻한 느낌을 만듭니다.
      return { r: red + 18, g: green + 7, b: blue - 12 };
    }
  },
  {
    name: "cool",
    label: "시원하게",
    apply: function (red, green, blue) {
      // 푸른 기운을 더해 시원한 느낌을 만듭니다.
      return { r: red - 10, g: green + 3, b: blue + 18 };
    }
  },
  {
    name: "bright",
    label: "화사하게",
    apply: function (red, green, blue) {
      // 전체 밝기를 조금 높여 밝고 화사한 느낌을 만듭니다.
      return { r: red + 22, g: green + 22, b: blue + 22 };
    }
  }
];

/**
 * 원본 사진을 바꾸지 않고 선택한 색 필터가 적용된 새 캔버스를 돌려줍니다.
 * @param {HTMLCanvasElement} canvas 원본 사진이 담긴 캔버스
 * @param {string} filterName 적용할 필터의 내부 이름
 * @returns {HTMLCanvasElement} 필터가 적용된 새 캔버스
 */
function applyFilter(canvas, filterName) {
  // 내부 이름과 일치하는 필터 계산 방법을 찾습니다.
  var selectedFilter = FILTERS.find(function (filter) {
    return filter.name === filterName;
  });

  if (!selectedFilter) {
    throw new Error("선택한 필터를 찾을 수 없어요. 다른 필터를 골라 주세요.");
  }

  var filteredCanvas = document.createElement("canvas");
  filteredCanvas.width = canvas.width;
  filteredCanvas.height = canvas.height;

  var context = filteredCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("필터를 적용할 사진 화면을 만들지 못했어요.");
  }

  context.drawImage(canvas, 0, 0);

  // 사진의 모든 점에서 빨강·초록·파랑 값을 계산해 선택한 필터를 적용합니다.
  var imageData;
  try {
    imageData = context.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
  } catch (error) {
    throw new Error("사진 색을 읽지 못했어요. 페이지를 다시 열고 촬영해 주세요.");
  }

  var pixels = imageData.data;
  for (var index = 0; index < pixels.length; index += 4) {
    var changedColor = selectedFilter.apply(
      pixels[index],
      pixels[index + 1],
      pixels[index + 2]
    );

    pixels[index] = clamp(changedColor.r);
    pixels[index + 1] = clamp(changedColor.g);
    pixels[index + 2] = clamp(changedColor.b);
  }

  // 계산이 끝난 점 색을 새 캔버스에 반영합니다.
  context.putImageData(imageData, 0, 0);
  return filteredCanvas;
}
