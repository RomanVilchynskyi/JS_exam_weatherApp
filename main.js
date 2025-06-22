const apiKey = "9b55ac770f2eb3f7e7e8d4991c6e037d"; 

$(document).ready(function () {
    $(".tab").click(function () {
        $(".tab").removeClass("active");
        $(".tab-content").removeClass("active");
        $(this).addClass("active");
        $("#" + $(this).data("tab")).addClass("active");
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon);
        }, () => {
            getWeatherByCity("Rivne");
        });
    } else {
        getWeatherByCity("Rivne");
    }

    $("#search-btn").click(function () {
        const city = $("#city-input").val().trim();
        if (city) {
            getWeatherByCity(city);
        }
    });
});
function renderToday(data) {
    const date = new Date().toLocaleDateString("uk-UA");
    const temp = data.main.temp.toFixed(1);
    const feels = data.main.feels_like.toFixed(1);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString("uk-UA");
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString("uk-UA");

    const durationMs = data.sys.sunset * 1000 - data.sys.sunrise * 1000;
    const duration = new Date(durationMs).toISOString().substr(11, 5); 

    $("#current-weather").html(`
    <h2>${data.name} – ${date}</h2>
    <img src="${iconUrl}" alt="${desc}">
    <p>${desc}</p>
    <p>Температура: ${temp}°C</p>
    <p>Відчувається: ${feels}°C</p>
    <p>Світанок: ${sunrise}</p>
    <p>Захід сонця: ${sunset}</p>
    <p>Тривалість дня: ${duration}</p>
  `);
}

// ------------------------------

function getWeatherByCity(city) {
    $("#city-input").val(city);
    $.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ua`)
        .done((data) => {
            $("#error-message").hide();
            renderToday(data);
            get5DayForecast(data.coord.lat, data.coord.lon);
            getNearbyCities(data.coord.lat, data.coord.lon);
        })
        .fail(() => {
            showError(city);
        });
}


function getWeatherByCoords(lat, lon) {
    $.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ua`)
        .done((data) => {
            $("#city-input").val(data.name);
            $("#error-message").hide();
            renderToday(data);
            get5DayForecast(lat, lon);
            getNearbyCities(lat, lon);
        });
}

// ------------------------------

function get5DayForecast(lat, lon) {
    $.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ua`)
        .done(function (data) {
            renderForecast(data);
        });
}

// ------------------------------

function showError(city) {
    $(".tab-content").removeClass("active");
    $("#error-message").show();
    $("#error-text").text(`Місто "${city}" не знайдено. Введіть іншу назву.`);
}

function getWindDirection(deg) {
    const directions = ["Пн", "Пн-Сх", "Сх", "Пд-Сх", "Пд", "Пд-Зх", "Зх", "Пн-Зх"];
    return directions[Math.round(deg / 45) % 8];
}
// ------------------------------

function renderForecastDetails(dayList) {
    let html = "<h3>Погодинний прогноз:</h3>";
    dayList.forEach(item => {
        const time = item.dt_txt.split(" ")[1].slice(0, 5);
        const temp = item.main.temp.toFixed(1);
        const feels = item.main.feels_like.toFixed(1);
        const wind = item.wind.speed.toFixed(1);
        const direction = getWindDirection(item.wind.deg);
        const icon = item.weather[0].icon;
        const desc = item.weather[0].description;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        html += `
      <div class="weather-card">
        <h4>${time}</h4>
        <img src="${iconUrl}" alt="${desc}">
        <p>${desc}</p>
        <p>Температура: ${temp}°C</p>
        <p>Відчувається: ${feels}°C</p>
        <p>Вітер: ${wind} м/с, ${direction}</p>
      </div>
    `;
    });

    $("#selected-day-details").html(html);
}

// ------------------------------

function renderForecast(data) {
    const forecastByDay = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!forecastByDay[date]) {
            forecastByDay[date] = [];
        }
        forecastByDay[date].push(item);
    });

    const today = new Date().toISOString().split("T")[0];
    let html = "";

    Object.entries(forecastByDay).forEach(([date, items], index) => {
        const dayData = items[4] || items[0];
        const temp = dayData.main.temp.toFixed(1);
        const description = dayData.weather[0].description;
        const icon = dayData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        const dayName = new Date(date).toLocaleDateString("uk-UA", { weekday: "long" });

        html += `
      <div class="weather-card day-forecast" data-date="${date}" ${index === 0 ? 'style="border: 2px solid #007788;"' : ""}>
        <h3>${dayName}, ${date}</h3>
        <img src="${iconUrl}" alt="${description}">
        <p>${temp}°C — ${description}</p>
      </div>
    `;
    });

    $("#daily-forecast").html(html);
    renderForecastDetails(forecastByDay[today]);


    $(".day-forecast").click(function () {
        $(".day-forecast").css("border", "none");
        $(this).css("border", "2px solid #007788");

        const selectedDate = $(this).data("date");
        renderForecastDetails(forecastByDay[selectedDate]);
    });
}





// ------------------------------

function getNearbyCities(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=6&appid=${apiKey}&units=metric&lang=ua`;

    $.get(url).done(function (data) {
        let html = "<h3>Найближчі міста:</h3><div class='nearby-container'>";

        data.list.forEach(city => {
            if (city.name !== $("#city-input").val()) {
                const temp = city.main.temp.toFixed(1);
                const icon = city.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                const name = city.name;

                html += `
          <div class="weather-card nearby-card">
            <h4>${name}</h4>
            <img src="${iconUrl}" alt="">
            <p>${temp}°C</p>
          </div>
        `;
            }
        });

        html += "</div>";
        $("#nearby-cities").html(html);
    });
}
