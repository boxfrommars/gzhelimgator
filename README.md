gzhelimgator
============

галерея картинок. отрисовывает картинки в контейнере в заданных блоках, по таймеру меняет изображение, используя анимациию. 

[демо](http://boxfrommars.github.com/demos/gzhelimgator/index.htm "gzhelimgator demo")

использование
-------------

html:

    <canvas id="img-gallery" width="400" height="250"></canvas>
    <div id="img-view"></div>

js:

    // раскладка галереи по блокам 
    var layout = [
        {
            size: {width: 200, height: 250}, 
            position: {x: 0, y: 0}
        },
        {
            size: {width: 200, height: 125}, 
            position: {x: 200, y: 0}
        },
        {
            size: {width: 200, height: 125}, 
            position: {x: 200, y: 125}
        }
    ]
    
    // массив изображений
    var imgs = [
        "http://flickholdr.com/500/550", 
        "http://flickholdr.com/900/450", 
        "http://flickholdr.com/700/800", 
        "http://flickholdr.com/750/400", 
        "http://flickholdr.com/300/950", 
        "http://flickholdr.com/850/800", 
        "http://flickholdr.com/900/250", 
        "http://flickholdr.com/700/800", 
        "http://flickholdr.com/700/450", 
        "http://flickholdr.com/500/750"
    ]
    

    // канвас, в который мы будем оторбражать картинки
    var container = document.getElementById('img-gallery');
    
    // задержка между обновлением каринок
    var interval = 2000; 

    // срабатывает по клику на контейнер (если попали в блок), принимает собственно событие
    // и блок на котором кликнули -- объект вида {image: object Image(), size: {...}, position: {}}
    var clickHandler = function(e, block) {
        document.getElementById('img-view').innerHTML = '';
        document.getElementById('img-view').appendChild(block.image);
    }
    
    // тип анимации
    // по умолчанию 'fade', доступны только 'slide' и 'fade', можно дописывать свои анимации, см. ниже
    var animationType = 'slide'; 

    // включаем галерею
    var gallery = new Gzhelimgator(container, imgs, layout, interval, clickHandler, animationType);

остановить анимацию:

    gallery.stop();

продолжить анимацию:

    gallery.start();

добавить новый рендерер/тип анимации (для подробностей см. исходный код):

    Gzhelimgator.addRenderer(animationName, function(container, block) {});

    
