
$(function(){

var accuweatherAPIKey = "xIND6PB6QttSgPorpW86Y1vASs0ClIGS"
var mapBoxToken = "pk.eyJ1IjoibWVzc2lhc29saSIsImEiOiJja2h2dWowZmkxZTk1MzRvNW45c2U2d3h1In0.qhb3a4Gvh8mhdpwXaihQAQ"
var weatherObject = {
    cidade: "",
    estado: "",
    pais: "",
    temperatura: "",
    texto_clima: "",
    icone_clima: ""

    
}

function preencherClimaAgora(cidade, estado, pais, temperatura, texto_clima, icone_clima){
    var texto_local = cidade + ", " + estado + ". " + pais;
    $("#texto_local").text(texto_local);
    $("#texto_clima").text(texto_clima);
    $("#texto_temperatura").html(String(temperatura) + "&deg");
    $("#icone_clima").css("background-image", "url('"+icone_clima+"')")
}

function gerarGrafico(horas, temperaturas){
    Highcharts.chart('hourly_chart', {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Temperatura hora a hora'
        },
        xAxis: {
            categories: horas
        },
        yAxis: {
            title: {
                text: 'Temperatura (°C)'
            }
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: false
            }
        },
        series: [{
            showInLegend: false,
            data: temperaturas
        }]
    });
}

function pegarPrevisaoHoraAHora(localCode){
    $.ajax({
        url: "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
        type: "GET",
        dataType: "json",
        success: function(data){
            //console.log("previsaoHoraAHora: ", data);
            
            var temperaturas = [];
            var horas = [];

            for(var a = 0; a < data.length; a++){
                var hora = new Date(data[a].DateTime).getHours();
                horas.push(String(hora) + "h");
                temperaturas.push(data[a].Temperature.Value);
            }


            gerarGrafico(horas, temperaturas);
            $('.refresh-loader').fadeOut();
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            gerarErro("Erro ao obter a previsão hora a hora");
        }
    });
}

function preencherPrevisao5Dias(previsoes){
    $("#info_5dias").html("");
    var diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];

    for(var a = 0; a < previsoes.length; a++){
        var dataHoje = new Date(previsoes[a].Date);
        var dia_semana = diasSemana[dataHoje.getDay()];

        var iconNumber = previsoes[a].Day.Icon <= 9 ? "0" + String(previsoes[a].Day.Icon) : previsoes[a].Day.Icon;
        var iconeClima = "https://developer.accuweather.com/sites/default/files/" + iconNumber + "-s.png";
        var maximum = String(previsoes[a].Temperature.Minimum.Value);
        var minimum = String(previsoes[a].Temperature.Minimum.Value);

        elementoHtmlDia =

        '<div class="day col">' +
            '<div class="day_inner">' +
                '<div class="dayname">' +
                    dia_semana +
                '</div>' +
                '<div style="background-image: url(\''+ iconeClima +'\')" class="daily_weather_icon"></div>' +
                '<div class="max_min_temp">' +
                    + minimum + '&deg; / ' + maximum + '&deg;' +
                '</div>' +
            '</div>' +
        '</div>';

        $("#info_5dias").append(elementoHtmlDia);
        elementoHtmlDia = "";
    }
}

function pegarPrevisao5Dias(localCode){
    $.ajax({
        url: "http://dataservice.accuweather.com/forecasts/v1/daily/5day/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
        type: "GET",
        dataType: "json",
        success: function(data){
            //console.log("5 day forecast: ", data);
            $("#texto_max_min").html(String(data.DailyForecasts[0].Temperature.Minimum.Value) + "&deg; / " + String(data.DailyForecasts[0].Temperature.Maximum.Value) + "&deg;")

            preencherPrevisao5Dias(data.DailyForecasts);
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            gerarErro("Erro ao obter a previsão de 5 dias");
        }
    });
}

function pegarTempoAtual(localCode){
    $.ajax({
        url: "http://dataservice.accuweather.com/currentconditions/v1/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&details=true",
        type: "GET",
        dataType: "json",
        success: function(data){
           // console.log("CurrentConditions: ", data);

            weatherObject.temperatura = data[0].Temperature.Metric.Value;
            weatherObject.texto_clima = data[0].WheatherText;

            var iconNumber = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : data[0].WeatherIcon;

            weatherObject.icone_clima = "https://developer.accuweather.com/sites/default/files/" + iconNumber + "-s.png";


            preencherClimaAgora(weatherObject.cidade, weatherObject.estado, weatherObject.pais, weatherObject.temperatura, weatherObject.texto_clima, weatherObject.icone_clima)
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            $('.refresh-loader').fadeOut();
            gerarErro("Erro ao obter clima atual");
        }
    });
}

function pegarLocalUsuario(lat, long){
    $.ajax({
        url: "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=" + accuweatherAPIKey + "&q="+ lat +"%2C" + long + "&language=pt-br",
        type: "GET",
        dataType: "json",
        success: function(data){
            //console.log("GeoPosition: ", data);
            
            try {
                weatherObject.cidade = data.LocalizedName;
            } catch {
                weatherObject.cidade = data.ParentCity.LocalizedName
            }

            weatherObject.estado = data.AdministrativeArea.LocalizedName;
            weatherObject.pais = data.Country.LocalizedName;

            var localCode = data.Key
            pegarTempoAtual(localCode);
            pegarPrevisao5Dias(localCode);
            pegarPrevisaoHoraAHora(localCode);
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            gerarErro("Erro no código de local");
        }
    });
}

function pegarCorordenadasDaPesquisa(input){
    input = encodeURI(input);
    $.ajax({
        url: "https://api.mapbox.com/geocoding/v5/mapbox.places/" + input + ".json?access_token=" + mapBoxToken,
        type: "GET",
        dataType: "json",
        success: function(data){
            //console.log("MapBox: ", data);

            try{
                var long = data.features[0].geometry.coordinates[0];
                var lat = data.features[0].geometry.coordinates[1];
            }catch{
                gerarErro("Erro na pesquisa de local");
            }
            

            pegarLocalUsuario(lat, long);
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            gerarErro("Erro na pesquisa de local");
        }
    });
}

function pegarCordenadasDoIp(){

    var lat_padrao = "-21.586299604742223";
    var long_padrao = "-48.37296125757529";

    $.ajax({
        url: "http://www.geoplugin.net/json.gp",
        type: "GET",
        dataType: "json",
        success: function(data){
            //console.log("GeoPlugin", data);

            if(data.geoplugin_latitude && data.geoplugin_longitude){
                pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude);
            }else{
                
            }           
        },
        error: function(){
            console.log("Erro no recebimento das informações.");
            pegarLocalUsuario(lat_padrao, long_padrao);
        }
    });
}

$("#search-button").click(function(){
    var local = $("input#local").val();
    if (local){
        $('.refresh-loader').show();
        pegarCorordenadasDaPesquisa(local);
    } else{
        alert('Local inválido')
    }
});

$("input#local").on('keypress', function(e){
    if (e.which == 13){
        var local = $("input#local").val();
        if (local){
            $('.refresh-loader').show();
            pegarCorordenadasDaPesquisa(local);
        } else{
            alert('Local inválido')
        }
    }
});

function gerarErro(mensagem){
    if(!mensagem){
        mensagem = "Erro na solicitação";
    }

    $("#aviso-erro").text(mensagem);
    $('.refresh-loader').hide();
    $("#aviso-erro").slideDown();
    window.setTimeout(function(){
        $("#aviso-erro").slideUp();
    },4000);
}

gerarGrafico()
pegarCordenadasDoIp()

});