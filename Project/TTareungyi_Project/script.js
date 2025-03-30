// DOM이 로드된 후 실행
window.onload = function () {
  // 지도 생성
  var container = document.getElementById("map");
  var options = {
    center: new kakao.maps.LatLng(37.5665, 126.878), // 서울 중심
    level: 8, // 적절한 확대 수준
  };
  var map = new kakao.maps.Map(container, options);

  //---------------사이드바 관련--------------------

  // 사이드바 열기/닫기
  document.getElementById("openBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.add("active");
  });
  document.getElementById("closeBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.remove("active");
  });

  // 메뉴 토글 기능
  document.querySelectorAll(".menu-toggle").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const parentLi = this.parentElement;
      parentLi.classList.toggle("active");
    });
  });

  //----------------자치구 데이터 로드 및 지도 표시 함수--------------------
  // 기존에 그려진 다각형을 저장할 배열  // 전역 변수 선언
  var polygons = [];
  var overlays = [];

  // 폴리곤 및 오버레이 제거 함수
  function clearPolygons() {
    polygons.forEach((polygon) => polygon.setMap(null));
    overlays.forEach((overlay) => overlay.setMap(null));
    polygons = [];
    // overlays = [];
  }

  function loadDistricts() {
    clearPolygons();
    clearChart();

    let districtData = {};
    const overlays = []; // 모든 오버레이를 저장할 배열

    fetch("./data/result_file/자치구별 대여소 분포도.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.trim().split("\n");
        const rentalCounts = [];

        for (let i = 1; i < lines.length; i++) {
          const [district, count] = lines[i].split(",");
          districtData[district.trim()] = parseInt(count.trim());
          rentalCounts.push(parseInt(count.trim()));
          // console.log(district, count);  //자치구 이름과 대여소개수
        }

        const minCount = Math.min(...rentalCounts);
        const maxCount = Math.max(...rentalCounts);

        return fetch("./json_file/seoul_geo.json")
          .then((response) => response.json())
          .then((data) => {
            // console.log("Total features:", data.features.length); // 자치구 개수 확인
            data.features.forEach((feature, index) => {
              let polygonPath = [];
              const coordinates = feature.geometry.coordinates[0];
              const districtName = feature.properties.SGG_NM || "Unknown";

              // console.log(`Processing [${index}]: ${districtName}`); // 각 자치구 처리 로그

              coordinates.forEach((coord) => {
                const lng = coord[0];
                const lat = coord[1];
                polygonPath.push(new kakao.maps.LatLng(lat, lng));
              });

              const count = districtData[districtName] || 0;
              const colorIntensity = (count - minCount) / (maxCount - minCount);
              const greenValue = Math.round(255 * colorIntensity);
              const fillColor = `rgb(0, ${greenValue}, 0)`;

              // 폴리곤 생성
              var polygon = new kakao.maps.Polygon({
                path: polygonPath,
                strokeWeight: 2,
                strokeColor: "#000000",
                strokeOpacity: 0.8,
                strokeStyle: "solid",
                fillColor: fillColor,
                fillOpacity: 0.7,
              });

              polygon.setMap(map);
              polygons.push(polygon);

              // 마우스 오버 이벤트
              kakao.maps.event.addListener(polygon, "mouseover", function () {
                polygon.setOptions({ fillColor: "#000000", fillOpacity: 0.3 });
              });

              // 마우스 아웃 이벤트
              kakao.maps.event.addListener(polygon, "mouseout", function () {
                polygon.setOptions({ fillColor: fillColor, fillOpacity: 0.7 });
              });

              // 폴리곤 중심에 자치구 이름 표시
              const position = calculateCentroid(polygonPath);
              if (!position) {
                console.error("Centroid calculation failed for", districtName);
                return; // 다음 자치구로 진행
              }

              const content = `<div style="padding: 5px; background: white; border: 1px solid black; border-radius: 3px; font-weight: bold;">${districtName}(${count})</div>`;
              const overlay = new kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1,
              });

              overlay.setMap(map);

              // overlays.push(overlay);
              // console.log(`Overlay added for ${districtName} at`, position); // 오버레이 추가 확인
            });
          })
          .catch((error) => console.error("JSON 파일 로드 오류:", error));
      })
      .catch((error) => console.error("CSV 파일 로드 오류:", error));
  }

  // 다각형의 중심 계산 함수
  function calculateCentroid(polygonPath) {
    if (!polygonPath || polygonPath.length === 0) {
      console.error("Invalid polygonPath:", polygonPath);
      return null;
    }

    let area = 0;
    let cx = 0;
    let cy = 0;
    const n = polygonPath.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const xi = polygonPath[i].La; // 경도
      const yi = polygonPath[i].Ma; // 위도
      const xj = polygonPath[j].La;
      const yj = polygonPath[j].Ma;

      const factor = xi * yj - xj * yi;
      area += factor;
      cx += (xi + xj) * factor;
      cy += (yi + yj) * factor;
    }

    area /= 2;
    const absArea = Math.abs(area);
    if (absArea < 1e-10) {
      console.error("Area too small or zero:", area);
      return null;
    }

    cx = cx / (6 * area);
    cy = cy / (6 * area);

    return new kakao.maps.LatLng(cy, cx);
  }

  //------------------전체 대여량 분석 chart부분---------------------------
  var chart = null; // Chart.js 인스턴스 저장
  let currentChartType = null; // 현재 차트 유형 추적

  // 차트 제거 함수
  function clearChart() {
    const canvas = document.getElementById("rentalChart");
    if (canvas) {
      canvas.style.display = "none";
    }
    chartContainer.style.display = "none";

    document.getElementById("map").classList.remove("blur");
    if (chart) {
      chart.destroy();
      chart = null;
    }

    monthSlider.style.display = "none";
    monthLabel.style.display = "none";
    currentChartType = null;
  }

  // 슬라이더 이벤트 리스너
  const monthSlider = document.getElementById("monthSlider");
  const monthLabel = document.getElementById("monthLabel");
  monthSlider.style.display = "none"; // 초기 숨김
  monthLabel.style.display = "none"; // 초기 숨김
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // 차트 업데이트 함수
  function updateChart(selectedMonth) {
    const chartContainer = document.getElementById("chartContainer");
    const canvas = document.getElementById("rentalChart");
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }
    chartContainer.style.display = "block";
    canvas.style.display = "block";
    monthSlider.style.display = "block";
    monthLabel.style.display = "block";
    document.getElementById("map").classList.add("blur");

    fetch(`./data/result_file/24년-월대여량-${selectedMonth}.csv`)
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.trim().split("\n");
        const labels = [];
        const weekendData = [];
        const weekdayData = [];

        for (let i = 1; i < lines.length; i++) {
          const [day, rental, dayType] = lines[i].split(",");
          const dayNum = day.trim();
          const rentalNum = parseInt(rental.trim()) || 0;
          const type = dayType.trim();

          labels.push(`${dayNum}일`);
          if (type === "주말") {
            weekendData.push(rentalNum);
            weekdayData.push(null);
          } else if (type === "평일") {
            weekdayData.push(rentalNum);
            weekendData.push(null);
          }
        }

        var monthlyData = {
          labels: labels,
          datasets: [
            {
              label: "주말 대여량",
              data: weekendData,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
              barThickness: 12,
            },
            {
              label: "평일 대여량",
              data: weekdayData,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
              barThickness: 12,
            },
          ],
        };

        if (chart) {
          // 기존 차트 업데이트
          chart.data = monthlyData;
          chart.options.plugins.title.text = `2024년 ${selectedMonth} 월 일별 대여량`;
          chart.update();
          console.log("Chart updated successfully");
        } else {
          // 새 차트 생성
          try {
            chart = new Chart(canvas.getContext("2d"), {
              type: "bar",
              data: monthlyData,
              options: {
                scales: {
                  y: {
                    beginAtZero: true, // Y축이 0에서 시작
                    min: 0, // Y축 최소값 고정
                    max: 250000, // Y축 최대값 고정
                    ticks: { font: { size: 16 } }, // 틱 레이블 크기 유지
                  },
                  x: { ticks: { font: { size: 16 } } }, // X축은 변경 없음
                },
                plugins: {
                  legend: { display: true, labels: { font: { size: 18 } } },
                  title: {
                    display: true,
                    text: `2024년 ${selectedMonth} 일별 대여량`,
                    font: { size: 20 },
                  },
                },
              },
            });
            console.log("Chart created successfully");
          } catch (error) {
            console.error("Chart creation failed:", error);
          }
        }
      })
      .catch((error) => console.error("CSV 파일 로드 오류:", error));
  }

  // 시간별 대여량 차트 업데이트 함수
  function updateTimesChart(selectedMonth) {
    const chartContainer = document.getElementById("chartContainer");
    const canvas = document.getElementById("rentalChart");
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }
    chartContainer.style.display = "block";
    canvas.style.display = "block";
    monthSlider.style.display = "block";
    monthLabel.style.display = "block";
    document.getElementById("map").classList.add("blur");

    fetch(`./data/result_file/출퇴근시간대여량-${selectedMonth}.csv`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((csvText) => {
        const lines = csvText.trim().split("\n");
        const labels = [];
        const rentalData = [];

        // 0~23시 초기화
        for (let i = 0; i < 24; i++) {
          labels.push(`${i.toString().padStart(2, "0")}:00`);
          rentalData.push(0); // 기본값 0
        }

        // CSV 데이터로 채우기 (헤더 제외)
        for (let i = 1; i < lines.length; i++) {
          const [hour, rental] = lines[i].split(",");
          const hourNum = parseInt(hour.trim());
          const rentalNum = parseInt(rental.trim()) || 0;
          rentalData[hourNum] = rentalNum;
        }

        var timesData = {
          labels: labels,
          datasets: [
            {
              label: "시간별 대여량",
              data: rentalData,
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
              fill: false, // 선 아래 채우기 비활성화
              tension: 0.1, // 선의 곡률
            },
          ],
        };

        if (chart) {
          chart.data = timesData;
          chart.options.plugins.title.text = `2024년 ${selectedMonth} 시간별 대여량`;
          chart.update();
          console.log("Times Chart updated successfully");
        } else {
          try {
            chart = new Chart(canvas.getContext("2d"), {
              type: "line", // 선형 차트
              data: timesData,
              options: {
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                    max: 600000, // 최대 대여량(394195)을 고려해 설정
                    ticks: { font: { size: 16 } },
                  },
                  x: {
                    ticks: { font: { size: 12 } }, // 시간 레이블이 많아 크기 조정
                  },
                },
                plugins: {
                  legend: { display: true, labels: { font: { size: 18 } } },
                  title: {
                    display: true,
                    text: `2024년 ${selectedMonth} 시간별 대여량`,
                    font: { size: 20 },
                  },
                },
              },
            });
            console.log("Times Chart created successfully");
          } catch (error) {
            console.error("Times Chart creation failed:", error);
          }
        }
      })
      .catch((error) => {
        console.error("CSV 파일 로드 오류:", error);
        chartContainer.innerHTML = `<p>데이터를 불러오지 못했습니다: ${error.message}</p>`;
      });
  }

  //여기가 슬라이드 값이 바뀌면 차트 재요청 부분
  monthSlider.addEventListener("input", function () {
    const monthIndex = parseInt(this.value) - 1;
    monthLabel.textContent = `${monthIndex + 1}월 (${months[monthIndex]})`;
    const chartContainer = document.getElementById("chartContainer");
    if (chartContainer.style.display === "block") {
      if (currentChartType === "monthly") {
        updateChart(months[monthIndex]);
        console.log("dddddd", months[monthIndex]);
      } else if (currentChartType === "times") {
        updateTimesChart(months[monthIndex]);
        console.log(months[monthIndex]);
      }
    }
  });

  //------------------부제목 클릭시 출력하는는 부분---------------------------

  document.querySelectorAll(".show-monthly-rentals").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Clicked show-monthly-rentals");
      clearPolygons();
      clearChart();
      currentChartType = "monthly"; // 차트 유형 설정

      const monthIndex = parseInt(monthSlider.value) - 1;
      const selectedMonth = months[monthIndex];

      updateChart(selectedMonth);

      const chartContainer = document.getElementById("chartContainer");
      const canvas = document.getElementById("rentalChart");
      canvas.addEventListener(
        "click",
        function () {
          chartContainer.style.display = "none";
          document.getElementById("map").classList.remove("blur");
          if (chart) {
            chart.destroy();
            chart = null;
          }
          currentChartType = null; // 차트 유형 초기화
        },
        { once: true }
      );
    });
  });

  document.querySelectorAll(".show-times-rentals").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Clicked show-times-rentals");
      clearPolygons();
      clearChart();
      currentChartType = "times"; // 차트 유형 설정

      const monthIndex = parseInt(monthSlider.value) - 1;
      const selectedMonth = months[monthIndex];

      updateTimesChart(selectedMonth);

      const chartContainer = document.getElementById("chartContainer");
      const canvas = document.getElementById("rentalChart");
      canvas.addEventListener(
        "click",
        function () {
          chartContainer.style.display = "none";
          document.getElementById("map").classList.remove("blur");
          if (chart) {
            chart.destroy();
            chart = null;
          }
          currentChartType = null; // 차트 유형 초기화
        },
        { once: true }
      );
    });
  });

  // "자치구별 대여소 분포도" 클릭 시 지도에 표시
  document.querySelectorAll(".show-districts").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      loadDistricts();
      clearChart();
    });
  });
};
