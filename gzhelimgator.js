/**
 * галерея картинок. отрисовывает картинки в контейнере в заданных блоках, по таймеру меняет изображение,
 * используя анимациию. 
 *
 * @param container DOMElement (canvas)
 * @param imageSources [string] массив src картинок
 * @param layout [{position: {x: int, y: int}, size: {width: int, height: int}}] раскладка блоков
 * @param interval int [opt] задержка межжду изменениями картинок
 * @param clickHandler func [opt] колбек на клик по контейнеру.(Event e, block {position: {...}, size: {...}, image: Image})
 * @param rendererName string [opt] имя рендерера
 * 
 * @return obj Gzhelimgator instance
 */
var Gzhelimgator = function(container, imageSources, layout, interval, clickHandler, rendererName){

    this._container = container; 
    this._imageSources = imageSources;
    this._layout = layout; // массив блоков
    this._interval = interval > 0 ? interval : 2000; // интервал изменения картинок
    this._clickHandler = clickHandler || function(){};
    this._rendererName = rendererName || 'fade';
    
    this._isRun = false; // запускался ли this._run()
    this._intervalId = null; // указатель на setInterval
    
    this._currentBlockOffset = -1; // порядковый элемент блока, считающегося текущим
    this._images = []; // картинки (массив объектов Images)
    this._currentImageOffset = -1; // порядковый элемент блока, считающегося текущим
    
    this._container.gzhelimgator = this; // ссылаемся на наш объект галереи в канвасе (для обработчиков событий)
    
    this._preloadImagesThenRun(); // предзагружаем картинки и выполняем, после загрузки начинаем работу
};

Gzhelimgator.prototype = {
    
    /**
     * начать менять картинки каждые this._interval секунд
     */
    start: function() {
        var that = this;
        if (this._isRun && !this._intervalId) {
            this._intervalId = window.setInterval(function() {
                that._step();
            }, this._interval);
        }
    },
    
    /**
     * перестать менять картинки
     */
    stop: function() {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = false;
        }
    },
    
    _getNextBlock: function() {
        this._currentBlockOffset = (this._currentBlockOffset + 1) % this._layout.length;
        return this._layout[this._currentBlockOffset];
    },
    
    _getNextImage: function() {
        this._currentImageOffset = (this._currentImageOffset + 1) % this._images.length;
        return this._images[this._currentImageOffset];
    },
    
    /**
     * отрисовывает изображение в переданный блок
     * 
     * @param block блок в который отрисовываем
     * @param image obj Image() изображение, которое отрисовываем
     */
    _setBlockImage: function(block, image) {
        var slice = this._calculateImageSlice(block, image);        
        var renderer = Gzhelimgator.getRenderer(this._rendererName);
        renderer(this._container, block, image, slice);
        block.image = image;
    },
    
    /**
     * находит максимальную (одно из измерений картинки остаётся неизменным) область (slice) картинки пропорционально 
     * равную блоку, в который отрисовываем.
     * возвращает объект содержащий координаты верхней левой точки (отн. картинки) и размер области
     *
     * @param block блок в который отрисовываем
     * @param image obj Image() изображение, которое отрисовываем
     * 
     * @return {topLeftPoint: {x: int, y: int}, size: {width: int, height: int}} 
     */
    _calculateImageSlice: function(block, image) {
        var slice = {
           topLeftPoint: {x: 0, y: 0},
           size: {width: image.width, height: image.height}
        };
        
        // смотрим, пропорционально площе ли картинка заданной области, 
        // если да (нет), то высота (ширина) области равна высоте (ширине) картинки,
        // а ширина (высота) -- прпорционально увеличенной ширине (высоте) блока.
        // находим левую верхнюю точку так, чтобы область оказалась в центре
        var isImageFlatter = image.width / image.height > block.size.width / block.size.height;
        if (isImageFlatter) {
            slice.size.width = Math.round(block.size.width * (image.height / block.size.height));
            slice.topLeftPoint.x = Math.floor((image.width - slice.size.width) / 2);
        } else {
            slice.size.height = Math.round(block.size.height * (image.width / block.size.width));
            slice.topLeftPoint.y = Math.floor((image.height - slice.size.height) / 2);
        }
        
        return slice;
    },
    
    _changeBlockImage: function(block, image) {
        this._setBlockImage(block, image);
    },
    
    /**
     * выполняется интервалом. шаг работы.
     */
    _step: function() {
        this._changeBlockImage(this._getNextBlock(), this._getNextImage());
    },
    
    /**
     * загружаем нужное для начала работы кол-во картинок (равное количеству блоков в галерее),
     * запускаем смену картинок и всё такое
     */
    _preloadImagesThenRun: function() {
        var that = this,
            image;
        
        for (var i = 0; i < this._imageSources.length; i++) {
            image = new Image();
            // после загрузки изображения -- добавляем его в массив картинок галереи (this._images), 
            // как только картинок хватает на заполнение галереи -- запускаем this._run.
            // т. к. в галерее крутятся только те картинки, которые есть в this._images, то не нужно 
            // ждать загрузки всех изображений. после рана картинки продолжают добавляться в фоне
            // @TODO нужно ли реализовывать onerror/onabort события? 
            image.onload = function(){
                that._images.push(this);
                if(that._images.length == that._imageSources.length) {
                    that._run();
                }
            };
            image.src = this._imageSources[i];
        }
    },
    
    /**
     * запуск. к этому моменту как минимум this._layout.length картинок должно быть загружено
     * устанавливаем картинку в галерею, вешаем обработчики событий. включаем смену изображений по интервалу
     */
    _run: function() {
        for (var i = 0; i < this._layout.length; i++) {
            this._changeBlockImage(this._getNextBlock(), this._getNextImage());
        }
    
        // по наведению на контейнер останавливаем смену картинок
        this._container.addEventListener('mouseover', function() {
            this.gzhelimgator.stop();
        });
        
        // после ухода с контейнера продолжаем смену картинок
        this._container.addEventListener('mouseout', function() {
            this.gzhelimgator.start();
        });
        
        // по клику (если попали на блок в контейнере) вызываем колбек
        this._container.addEventListener('mousedown', function(e) {
            var blockClicked = this.gzhelimgator._getBlockByPoint(this.gzhelimgator._getMousePosition(e, this));
            if (blockClicked) {
                this.gzhelimgator._clickHandler(e, blockClicked);
            } 
        });
        
        this._isRun = true; // ран уже запускался
        this.start();
    },
    
    /**
     * положение курсора относительно элемента
     * 
     * @link http://webcodingeasy.com/Javascript/Get-relative-cursor-positions
     * 
     * @param e event
     * @param elem элемент, относительно которого находим положение
     * 
     * @return {x: int, y: int}
     */
    _getMousePosition: function(e, elem) {
        //checking if pageY and pageX is already available
        if (typeof e.pageY == 'undefined' && typeof e.clientX == 'number' && document.documentElement) {
            //if not, then add scrolling positions
            e.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            e.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        };
        //temporary variables
        var x = y = 0;
        //check context of current element's offset position
        if (elem.offsetParent)
        {
            x = elem.offsetLeft;
            y = elem.offsetTop;
            //loop through all position contexts 
            //and sum up their positions
            while (elem = elem.offsetParent)
            {
                x += elem.offsetLeft;
                y += elem.offsetTop;
            };
        };
        //subtract contexts from from actual position 
        //to calculate relative position
        e.elemX = e.pageX - x;
        e.elemY = e.pageY - y;

        //return e which now contains pageX and pageY attributes
        //and provided elements relative position elemX and elemY
        return {x: e.elemX, y: e.elemY};
    },
    
    /**
     * блок лежащий под данной точкой
     * 
     * @param clickPosition {x: int, y: int} координаты точки
     * @return block|false
     */
    _getBlockByPoint: function(clickPosition) {
        var block;
        for (var i = 0; i < this._layout.length; i++) {
            block = this._layout[i];
            if (
                clickPosition.x >= block.position.x && 
                clickPosition.y >= block.position.y &&
                block.position.x + block.size.width >= clickPosition.x && 
                block.position.y + block.size.height >= clickPosition.y
            ) {
                return block;
            }
        }
        return false;
    }
}

/**
 * логика работы с канвасом вынесена в рендереры, поэтому допускаются даже неканвас рендереры (например, css3);
 * renderer -- просто функция (@TODO: объект?), вида function(canvas, block, image, slice){}
 */
Gzhelimgator.renderers = {};

Gzhelimgator.setRenderer = function(name, renderer) {
    Gzhelimgator.renderers[name] = renderer;
}

Gzhelimgator.getRenderer = function(name) {
    return Gzhelimgator.renderers[name];
}

Gzhelimgator.setRenderer('fade', function(canvas, block, image, slice) {
    var context = canvas.getContext('2d');
    var ga = 0; // будем хранить и менять значение globalAlpha (прозрачность контекста)
    
    var intervalId = window.setInterval(function() {
        ga += .1 * (1 - ga) + .01;
        if (ga >= 1) { // дошли до единицы, прекращаем
            window.clearInterval(intervalId);
            context.globalAlpha = 1;
        }
        context.globalAlpha = ga;
        context.drawImage(
            image, 
            slice.topLeftPoint.x, slice.topLeftPoint.y, slice.size.width, slice.size.height, // slice options
            block.position.x, block.position.y, block.size.width, block.size.height // resize options
        );
        // мягко меняем прозрачность. на самом деле мы рисуем поверх новые картинки (но прозрачность тоже меняется -- 
        // чтобы дойти до единицы)
        // @TODO подумать над сглаживаниями
        ga += .1 * (1 - ga) + .01; 
    }, 30);
});

// всё то же, что и в fade, только коэффициент отвечает за ширину кропа картинки и области в которую отрисовываем
Gzhelimgator.setRenderer('slide', function(canvas, block, image, slice) {
    var context = canvas.getContext('2d');
    var slideKoeff = 0;
    
    var intervalId = window.setInterval(function() {
        slideKoeff += .2 * (1 - slideKoeff) + .01;
        if (slideKoeff >= 1) {
            window.clearInterval(intervalId);
            slideKoeff = 1;
        }
        context.drawImage(
            image, 
            ~~(slice.topLeftPoint.x + (slice.size.width * (1 - slideKoeff))), 
            slice.topLeftPoint.y, 
            ~~(slice.size.width * slideKoeff), 
            slice.size.height, 
            block.position.x, 
            block.position.y, 
            ~~(block.size.width * slideKoeff), 
            block.size.height
        );
        
    }, 30);
});
