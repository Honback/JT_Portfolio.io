// API
// import { API_KEY } from "./env.js";

const tmdbCommand = "https://api.themoviedb.org/3";

const fetchmovies1 = async () => {
  const url = `${tmdbCommand}/movie/now_playing?api_key=8f07f96e79bd41a52356a387b0699384&language=ko-kr&page=1`;
  const response = await fetch(url);
  const { results } = await response.json();
  return results;
};

const fetchmovies2 = async () => {
  const url = `${tmdbCommand}/movie/upcoming?api_key=8f07f96e79bd41a52356a387b0699384&language=ko-kr&page=1`;
  const response = await fetch(url);
  const { results } = await response.json();
  return results;
};

const fetchmovies3 = async () => {
  const url = `${tmdbCommand}/movie/top_rated?api_key=8f07f96e79bd41a52356a387b0699384&language=ko-kr&page=1`;
  const response = await fetch(url);
  const { results } = await response.json();
  return results;
};

const youtubeTrailers = async (movieId) => {
  const url = `${tmdbCommand}/movie/${movieId}/videos?api_key=d9aff27da980d723fd407fadc621b9de&language=ko-kr`;
  const response = await fetch(url);
  const { results: trailers } = await response.json();
  return trailers;
};

const getMovies = async () => {
  const [movies1, movies2, movies3] = await Promise.all([
    fetchmovies1(),
    fetchmovies2(),
    fetchmovies3(),
  ]);

  const nowplayingUl = document.querySelector(".nowPlaying ul");
  const upcomingUl = document.querySelector(".upcoming ul");
  const topratedUl = document.querySelector(".toprated ul");

  // CreateElement
  const createElement = (movie, index, category) => {
    const {
      adult,
      genre_ids,
      id,
      overview,
      poster_path,
      release_date,
      title,
      vote_average,
    } = movie;
    const li = document.createElement("li");
    const moviePoster = document.createElement("div");
    const movieTitle = document.createElement("div");
    const movieDesc = document.createElement("div");
    const img = document.createElement("img");
    const ageLimit = document.createElement("span");
    const movieNum = document.createElement("span");
    const release = document.createElement("span");
    const vote = document.createElement("span");

    img.src = `https://image.tmdb.org/t/p/original/${poster_path}`;

    const adultKo = adult === false ? "ALL" : "18";
    ageLimit.innerText = adultKo;

    movieNum.innerText = index + 1;

    movieTitle.innerText = title;

    release.innerText = release_date;

    if (parseFloat(vote_average).toFixed(2) > 7.5) {
      vote.innerText = `😍${parseFloat(vote_average).toFixed(2)}`;
    } else if (parseFloat(vote_average).toFixed(2) > 6) {
      vote.innerText = `🤔${parseFloat(vote_average).toFixed(2)}`;
    } else {
      vote.innerText = `😣${parseFloat(vote_average).toFixed(2)}`;
    }

    moviePoster.className = "moviePoster";
    movieTitle.className = "movieTitle";
    movieDesc.className = "movieDesc";
    li.className = id;
    li.setAttribute("data-category", category);

    movieDesc.append(release, vote);
    moviePoster.append(img, ageLimit, movieNum);
    li.append(moviePoster, movieTitle, movieDesc);

    if (category === "nowplaying") {
      nowplayingUl.appendChild(li);
    } else if (category === "upcoming") {
      upcomingUl.appendChild(li);
    } else if (category === "toprated") {
      topratedUl.appendChild(li);
    }
  };

  // Now Playing
  movies1.forEach((movie, index) => {
    createElement(movie, index, "nowplaying");
  });

  // Upcoming
  movies2.forEach((movie, index) => {
    createElement(movie, index, "upcoming");
  });

  // TopRated
  movies3.forEach((movie, index) => {
    createElement(movie, index, "toprated");
  });

  // Moving Slide
  const initializeSlider = (
    sliderSelector,
    rightArrowSelector,
    leftArrowSelector
  ) => {
    const slider = document.querySelector(sliderSelector);
    const slides = slider.querySelectorAll("li");
    const slidesToShow = 5;
    const slideWidth = 160;
    const slideMargin = 25;
    let currentIndex = 0;
    let isTransitioning = false;

    const cloneCount = slidesToShow;

    const firstClones = Array.from(slides)
      .slice(0, cloneCount)
      .map((slide) => slide.cloneNode(true));

    const lastClones = Array.from(slides)
      .slice(-cloneCount)
      .map((slide) => slide.cloneNode(true));

    slider.prepend(...lastClones);
    slider.append(...firstClones);

    const updateSlider = () => {
      const offset =
        -(slideWidth + slideMargin) * (currentIndex + slidesToShow);
      slider.style.transform = `translateX(${offset}px)`;
    };

    slider.style.transition = "none";
    updateSlider();

    document.querySelector(rightArrowSelector).addEventListener("click", () => {
      if (isTransitioning) return;

      isTransitioning = true;
      currentIndex += slidesToShow;

      if (currentIndex === slides.length) {
        slider.style.transition = "transform 0.5s";
        updateSlider();

        setTimeout(() => {
          slider.style.transition = "none";
          currentIndex = 0;
          updateSlider();
          isTransitioning = false;
        }, 500);
      } else {
        slider.style.transition = "transform 0.5s";
        updateSlider();
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      }
    });
    document.querySelector(leftArrowSelector).addEventListener("click", () => {
      if (isTransitioning) return;

      isTransitioning = true;
      currentIndex -= slidesToShow;

      if (currentIndex < 0) {
        slider.style.transition = "transform 0.5s";
        updateSlider();

        setTimeout(() => {
          slider.style.transition = "none";
          currentIndex = slides.length - slidesToShow;
          updateSlider();
          isTransitioning = false;
        }, 500);
      } else {
        slider.style.transition = "transform 0.5s";
        updateSlider();
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      }
    });
  };

  initializeSlider(
    ".nowPlaying ul",
    "#nowPlayingRightArrow",
    "#nowPlayingLeftArrow"
  );
  initializeSlider(".upcoming ul", "#upcomingRightArrow", "#upcomingLeftArrow");
  initializeSlider(".toprated ul", "#topratedRightArrow", "#topratedLeftArrow");

  // Modal Event
  const movieItems = document.querySelectorAll(".movie li");
  const movieModal = document.querySelector(".modal-overlay");

  movieItems.forEach((movieItem) => {
    movieItem.addEventListener("click", async () => {
      movieModal.innerHTML = "";
      movieModal.classList.add("active");
      const id = parseInt(movieItem.className);
      const category = movieItem.getAttribute("data-category");

      let movie;

      switch (category) {
        case "nowplaying":
          movie = movies1.find((movie) => movie.id === id);
          break;
        case "upcoming":
          movie = movies2.find((movie) => movie.id === id);
          break;
        case "toprated":
          movie = movies3.find((movie) => movie.id === id);
          break;
      }

      let { title } = movie;
      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";
      modalContent.innerHTML = `
       <div class="modal-content">
        <div class="modal-bottom">
          <h1>${title}</h1>
          <section class="modal-trailer">Youtube</section>
        </div>
        <div class="modal-close">
          <i class="fas fa-xmark"></i>
        </div>
      </div>
      `;

      movieModal.appendChild(modalContent);
      const modalClose = document.querySelector(".modal-close");
      modalClose.addEventListener("click", () => {
        movieModal.classList.remove("active");
      });

      // Youtube Trailers
      try {
        const trailers = await youtubeTrailers(movie.id);
        if (trailers.length > 0) {
          const firstTrailer = trailers[0];
          if (firstTrailer.site === "YouTube") {
            const videoId = firstTrailer.key;
            const youtubeUrl = `https://www.youtube.com/embed/${videoId}`;

            const modalTrailer = modalContent.querySelector(".modal-trailer");
            const iframe = document.createElement("iframe");
            iframe.width = "1000";
            iframe.height = "500";
            iframe.src = youtubeUrl;
            iframe.allowFullscreen = true;
            modalTrailer.appendChild(iframe);
          }
        } else {
          console.log("해당 영화의 예고편이 존재하지 않습니다.");
        }
      } catch (error) {
        console.error(`영화 ID ${movie.id}의 예고편을 가져오지 못했습니다.`);
      }
    });
  });

  // Main Slide
  const mainSlider = document.querySelector(".mainSlider");

  movies1.forEach((movie) => {
    const figure = document.createElement("figure");
    figure.innerHTML = `<img src="https://image.tmdb.org/t/p/original/${movie.backdrop_path}" alt="img">`;
    mainSlider.appendChild(figure);
  });

  const figures = mainSlider.querySelectorAll("figure");
  let currentIndex = 0;

  const showNextSlide = () => {
    figures[currentIndex].classList.remove("active");
    currentIndex = (currentIndex + 1) % figures.length;
    figures[currentIndex].classList.add("active");
  };

  figures[currentIndex].classList.add("active"); // 첫호면 소닉

  setInterval(showNextSlide, 3000);
};

getMovies();

// GNB
const naviLis = document.querySelectorAll(".gnb > ul > li");

naviLis.forEach((naviLi) => {
  naviLi.addEventListener("mouseover", () => {
    const submenus = document.querySelectorAll(".submenu");
    const menuBg = document.querySelector(".menu_bg");
    submenus.forEach((submenu) => {
      submenu.style.maxHeight = "270px";
      submenu.style.opacity = "1";
      menuBg.style.maxHeight = "340px";
      menuBg.style.opacity = "1";
    });
  });
  naviLi.addEventListener("mouseout", () => {
    const submenus = document.querySelectorAll(".submenu");
    const menuBg = document.querySelector(".menu_bg");
    submenus.forEach((submenu) => {
      submenu.style.maxHeight = "0";
      submenu.style.opacity = "0";
      menuBg.style.maxHeight = "0";
      menuBg.style.opacity = "0";
    });
  });
});

// ACccordion
const contents = document.querySelectorAll(".content");
// contents[0].style.display = "block";
const titles = document.querySelectorAll(".title");
titles.forEach((title) => {
  title.addEventListener("click", () => {
    contents.forEach((item) => {
      item.style.display = "none";
    });
    titles.forEach((item) => {
      if (item !== title) {
        item.classList.remove("active");
      }
    });
    const content = title.nextElementSibling;
    if (title.classList.contains("active")) {
      title.classList.remove("active");
      content.style.display = "none";
    } else {
      title.classList.add("active");
      content.style.display = "block";
    }
  });
});

// Search Modal
const searchBtn = document.querySelector(".fa-magnifying-glass");
const modalSerach = document.querySelector(".modal-search");
const close = document.querySelector(".close");

searchBtn.addEventListener("click", () => {
  modalSerach.classList.add("active");
});

close.addEventListener("click", () => {
  modalSerach.classList.remove("active");
});
