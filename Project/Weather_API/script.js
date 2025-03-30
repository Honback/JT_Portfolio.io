import { weather_API_KEY, unsplash_API_KEY } from "./env.js";

const getCurrentWeather = (latitude, longitude) => {
  const URL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weather_API_KEY}&units=metric`;

  fetch(URL)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      const city = document.querySelector(".city");
      const weather = document.querySelector(".weather");
      const temp = document.querySelector(".temp");
      const icon = document.querySelector(".icon");

      let cityName;
      switch (data.name) {
        case "Jamwon-dong":
          cityName = "🚩역삼동";
          break;
      }

      let weatherInfo;
      switch (data.weather[0].main) {
        case "Clouds":
          weatherInfo = "☁️구름 조금";
        default:
          weatherInfo = data.weather[0].main;
          break;
      }
      weather.innerText = weatherInfo;
      city.innerText = cityName;
      temp.innerText = `🌡️${data.main.temp}℃`;
      icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    });
};

const getPosition = (position) => {
  const { latitude, longitude } = position.coords;
  getCurrentWeather(latitude, longitude);
};

const errorHandler = (error) => {
  console.log(error);
};

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(getPosition, errorHandler);
} else {
  console.log("geolocation is not available");
}

const imgURL = `https://api.unsplash.com/photos/random/?client_id=${unsplash_API_KEY}`;

fetch(imgURL)
  .then((response) => response.json())
  .then(({ urls: { full } }) => {
    const body = document.querySelector("body");
    body.style.backgroundImage = `url(${full})`;
  });
