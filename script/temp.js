require('../style/index.css');
(function (window) {
    /**
     * represents a danmaku
     * @param obj
     * @param canvas
     * @constructor
     */
    function Danmaku(obj, canvas) {

        var context = canvas.getContext('2d');

        this.value = obj.value;
        this.time = obj.time;

        /**
         * initialize the danmaku
         */
        this.init = function () {
            this.speed =  obj.speed;
            this.speed += this.speed ? obj.value.length / 100 : 0;

            this.fontSize = obj.fontSize;

            this.color = obj.color;

            this.range = obj.range;

            this.opacity = obj.opacity;

            /**
             * calc width of the content
             */
            var span = document.createElement('span');
            span.style.position = 'absolute';
            span.style.whiteSpace = 'nowrap';
            span.style.font = "bold " + this.fontSize + "px \"microsoft yahei\", sans-serif";
            span.innerText = obj.value;
            span.textContent = obj.value;
            document.body.appendChild(span);
            this.width = span.clientWidth;
            document.body.removeChild(span);

            this.x = canvas.width;
            if (this.speed === 0) {
                this.x = (this.x - this.width) / 2;
            }

            this.actualX = canvas.width;

            this.y = this.range[0] * canvas.height + (this.range[1] - this.range[0]) * canvas.height * Math.random();
        };

        /**
         * draw the danmaku
         */
        this.draw = function () {
            context.shadowColor = 'rgba(0,0,0,' + this.opacity + ')';
            context.shadowBlur = 2;
            context.font = this.fontSize + 'px "microsoft yahei", sans-serif';
            if (/rgb\(/.test(this.color)) {
                context.fillStyle = 'rgba('+ this.color.split('(')[1].split(')')[0] +','+ this.opacity +')';
            } else {
                context.fillStyle = this.color;
            }
            context.fillText(this.value, this.x, this.y);
        };
    }

    /**
     * represents a danmaku player.
     * @constructor
     * @param className - the class name of the video container
     * @param i - the index of current video
     */
    function DanmakuPlayer(className, i) {
        this.className = className;
        this.videoContainer = document.getElementsByClassName(this.className)[i];
        this.i = i;

        /**
         * default style of danmakus
         * @type {{opacity: number, fontSize: number, speed: number, range: [number,number], color: string, data: Array}}
         */
        this.defaults = {
            opacity: 1,
            fontSize: 24,
            speed: 2,
            range: [0, 1],
            color: 'white'
        };

        /**
         * danmakus that have been stored
         * @type {[]}
         */
        this.store = [];
    }


    /**
     * go into full screen mode
     * @param e - video element
     * @private
     */
    function _requestFullscreen(e) {
        if (e.requestFullscreen) {
            e.requestFullscreen();
        } else if (e.mozRequestFullScreen) {
            e.mozRequestFullScreen();
        } else if (e.msRequestFullscreen) {
            e.msRequestFullscreen();
        } else if (e.webkitRequestFullscreen) {
            e.webkitRequestFullscreen();
        } else {
            console.log("Your browser doesn't support requestFullscreen");
        }
    }

    /**
     * exit full screen mode
     * @private
     */
    function _exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else {
            console.log("Your browser doesn't support exitFullscreen");
        }
    }

    /**
     * format time to **:**
     * @param t - time to be formatted
     * @returns {string} - formatted time
     * @private
     */
    function _formatTime(t) {
        var m = parseInt(t / 60),
            s = parseInt(t % 60);
        function format(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }
        return format(m) + ":" + format(s);
    }

    /**
     * play/pause the video and change the icon of the playpause button(when click)
     * @private
     */
    function _changePlayPause(i) {
        return function () {
            var videos = document.getElementsByClassName("video"),
                video = videos[i],
                playPauses = document.getElementsByClassName("playpause"),
                playPause = playPauses[i],
                smallVideo = document.getElementsByClassName("small-video")[0];
            if (video.paused || video.ended) {
                playPause.className = "command playpause" + " pause";
                video.play();
                if (i === 0) {
                    smallVideo.play();
                }
            } else {
                playPause.className = "command playpause" + " play";
                video.pause();
                if (i === 0) {
                    smallVideo.pause();
                }
            }
        }
    }

    /**
     * set default styles if necessary
     * @param opts
     */
    DanmakuPlayer.prototype.setDefaults = function (opts) {
        for (var k in opts) {
            if (this.defaults.hasOwnProperty(k)) {
                this.defaults[k] = opts[k];
            }
        }
    };

    /**
     * initialize
     * @param url - url of the video
     */
    DanmakuPlayer.prototype.initialize = function (url) {
        this.createVideo(url);
        this.createPlayingComponents();
        this.setPlaying();
        this.setVolume();
        this.createDanmakuComponents();
        this.loadDanmaku();
        this.createSmallVideo(url);
        this.setSmallVideo();
    };

    /**
     * create the video
     * @param url
     */
    DanmakuPlayer.prototype.createVideo = function (url) {
        /**
         * initialize
         */
        var playBlock = document.createElement("div"),
            video = document.createElement("video"),
            danmakuBlock = document.createElement("canvas"),
            videoBlock = document.createElement("div");
        playBlock.className = "play-block";
        video.className = "video";
        danmakuBlock.className = "danmaku-block";
        videoBlock.className = "video-block";
        video.innerHTML = "<source src='" + url + "'>";

        /**
         * build DOM tree
         */
        videoBlock.appendChild(danmakuBlock);
        videoBlock.appendChild(video);
        playBlock.appendChild(videoBlock);
        this.videoContainer.appendChild(playBlock);
    };

    /**
     * create components in the playing bar
     */
    DanmakuPlayer.prototype.createPlayingComponents = function () {
        /**
         * initialize
         */
        var i = this.i,
            playInfo = document.createElement("div"),
            progressBar = document.createElement("div"),
            commandBlock = document.createElement("div"),
            playPause = document.createElement("button"),
            volumeBlock = document.createElement("div"),
            volume = document.createElement("button"),
            volumeRange = document.createElement("input"),
            time = document.createElement("div"),
            float =  document.createElement("button"),
            danmaku = document.createElement("button"),
            fullScreen = document.createElement("button"),
            playBlocks = document.getElementsByClassName("play-block"),
            playBlock = playBlocks[i],
            videos = document.getElementsByClassName("video"),
            video = videos[i];

        playInfo.className = "play-info";
        progressBar.className = "progress-bar";
        commandBlock.className = "command-block";
        playPause.className = "command playpause play";
        volumeBlock.className = "volume-block";
        volume.className = "command volume on";
        volumeRange.className = "volume-range";
        time.className = "time";
        float.className = "command float";
        danmaku.className = "command danmaku";
        fullScreen.className = "command full";

        volumeRange.setAttribute("min", "0");
        volumeRange.setAttribute("max", "1");
        volumeRange.setAttribute("step", "0.05");
        volumeRange.setAttribute("type", "range");

        progressBar.innerHTML = "<span class='progress'></span>";
        time.innerHTML = "<span class='present-time'>00:00</span>/<span class='total-time'>00:00</span>";

        /**
         * execute function _exitFullscreen or _requestFullscreen when click the fullScreen button
         */
        fullScreen.addEventListener("click", function () {
            if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
                _exitFullscreen();
                playInfo.style.position = "relative";
                playInfo.style.zIndex = "0";

            } else {
                _requestFullscreen(video);
                playInfo.style.position = "fixed";
                playInfo.style.zIndex = "2147483647";
            }
        });

        /**
         * change the style of play bar when exit fullScreen mode
         */
        document.addEventListener("fullscreenchange", function () {
            if (!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement)) {
                playInfo.style.position = "relative";
                playInfo.style.zIndex = "0";
            }
        });

        /**
         * build DOM tree
         */
        volumeBlock.appendChild(volume);
        volumeBlock.appendChild(volumeRange);
        commandBlock.appendChild(playPause);
        commandBlock.appendChild(volumeBlock);
        commandBlock.appendChild(time);
        commandBlock.appendChild(fullScreen);
        commandBlock.appendChild(danmaku);
        commandBlock.appendChild(float);
        playInfo.appendChild(progressBar);
        playInfo.appendChild(commandBlock);
        playBlock.appendChild(playInfo);
    };

    /**
     * set relevant properties when playing
     */
    DanmakuPlayer.prototype.setPlaying = function () {
        /**
         * initialize
         */
        var i = this.i,
            videos = document.getElementsByClassName("video"),
            video = videos[i],
            playPauses = document.getElementsByClassName("playpause"),
            playPause = playPauses[i];

        /**
         * set total time of the video
         */
        video.addEventListener("canplaythrough", function () {
            var totalTimes = document.getElementsByClassName("total-time"),
                totalTime = totalTimes[i];
            totalTime.innerHTML = _formatTime(video.duration);
        });

        /**
         * TODO
         */
        /**
         * buffered
         */
        video.addEventListener("progress", function () {

        });

        /**
         * update progress
         */
        video.addEventListener("timeupdate", function () {
            var presentTimes = document.getElementsByClassName("present-time"),
                presentTime = presentTimes[i],
                progresses = document.getElementsByClassName("progress"),
                progress = progresses[i];
            presentTime.innerHTML = _formatTime(video.currentTime);
            progress.style.width = (video.currentTime / video.duration * 100) + "%";
        });

        /**
         * switch between play and pause
         */
        video.addEventListener("click", _changePlayPause(this.i));
        playPause.addEventListener("click", _changePlayPause(this.i));

        /**
         * TODO
         */
        /**
         * drag the play bar
         */
        function foo() {

        }

        /**
         * TODO
         */
        /**
         * auto hide the play bar
         */
        function bar() {

        }
    };

    /**
     * apply the change of volume from user
     */
    DanmakuPlayer.prototype.setVolume = function () {
        /**
         * initialize
         */
        var volumeRanges = document.getElementsByClassName("volume-range"),
            volumeRange = volumeRanges[this.i],
            volumeButtons = document.getElementsByClassName("volume"),
            volumeButton = volumeButtons[this.i],
            videos = document.getElementsByClassName("video"),
            video = videos[this.i];

        /**
         * adjust the volume
         */
        volumeRange.addEventListener("change", function () {
            video.volume = volumeRange.value;
        });

        /**
         * turn on/off the volume
         */
        volumeButton.addEventListener("click", function () {
            if (!video.muted) {
                volumeButton.className = "command volume off";
            } else {
                volumeButton.className = "command volume on";
            }
            video.muted = !video.muted;
        });
    };

    /**
     * create components in danmaku bar
     */
    DanmakuPlayer.prototype.createDanmakuComponents = function () {
        /**
         * initialize
         */
        var i = this.i,
            store = this.store,
            defaults = this.defaults,
            canvas = document.getElementsByClassName("danmaku-block")[i],
            danmakuCommand = document.createElement("div"),
            input = document.createElement("input"),
            send = document.createElement("button"),
            settings = document.createElement("button"),
            danmakuStyle = document.createElement("div"),
            playBlock = document.getElementsByClassName("play-block")[i],
            danmakuButton = document.getElementsByClassName("danmaku")[i];

        danmakuCommand.className = "danmaku-command";
        input.className = "danmaku-input";
        send.className = "command danmaku-sender";
        settings.className = "command danmaku-settings";
        danmakuStyle.className = "danmaku-style";

        input.type = "text";
        input.placeholder = "输入弹幕";

        danmakuStyle.innerHTML =
            "<form>位置<br>" +
                "<input type='radio' name='range' value='[0, 1]'>全屏" +
                "<input type='radio' name='range' value='[0, 0.5]'>上方" +
                "<input type='radio' name='range' value='[0.5, 1]'>下方" +
            "</form>" +
            "<form>速度<br>" +
                "<input type='radio' name='speed' value='3'>快速" +
                "<input type='radio' name='speed' value='2'>普通" +
                "<input type='radio' name='speed' value='1'>慢速" +
                "<input type='radio' name='speed' value='0'>固定" +
            "</form>" +
            "<form>颜色<br>" +
                "<input type='radio' name='color' value='white'>白" +
                "<input type='radio' name='color' value='red'>红" +
                "<input type='radio' name='color' value='orange'>橙" +
                "<input type='radio' name='color' value='yellow'>黄" +
                "<input type='radio' name='color' value='green'>绿" +
                "<input type='radio' name='color' value='blue'>蓝" +
                "<input type='radio' name='color' value='purple'>紫" +
            "</form>";

        /**
         * build DOM tree
         */
        danmakuCommand.appendChild(input);
        danmakuCommand.appendChild(send);
        danmakuCommand.appendChild(settings);
        danmakuCommand.appendChild(danmakuStyle);
        playBlock.appendChild(danmakuCommand);

        /**
         * show/hide danmaku sending box
         */
        danmakuButton.addEventListener("click", function () {
            if (danmakuCommand.style.display === "block") {
                danmakuCommand.style.display = "none";
            } else {
                danmakuCommand.style.display = "block";
            }
        });

        /**
         * show/hide danmaku style settings
         */
        settings.addEventListener("click", function () {
            if (danmakuStyle.style.display === "block") {
                danmakuStyle.style.display = "none";
            } else {
                danmakuStyle.style.display = "block";
            }
        });

        /**
         * send danmaku when click the send button or press return key
         */
        input.addEventListener("keyup", function (e) {
            if (e.keyCode === 13) {
                sendDanmaku();
            }
        });
        send.addEventListener("click", sendDanmaku);

        /**
         * danmaku sender
         */
        function sendDanmaku() {
            /**
             * initailize
             */
            var video = document.getElementsByClassName("video")[i],
                input = document.getElementsByClassName("danmaku-input")[i],
                time = video.currentTime.toFixed(1),
                item = defaults,
                rangeRadios = document.getElementsByName("range"),
                speedRadios = document.getElementsByName("speed"),
                colorRadios = document.getElementsByName("color");

            /**
             * get danmakus info from localStorage
             */
            if (localStorage.getItem("danmakus")) {
                var danmakus = JSON.parse(localStorage.getItem("danmakus"));
            } else {
                danmakus = [];
                for (var j = 0; j < document.getElementsByClassName("video").length; j++) {
                    danmakus.push([]);
                }
            }

            /**
             * set options that user chose (use some magic numbers or it will be very complex)
             */
            for (j = 3 * i; j < (i + 1) * 3; j++) {
                if (rangeRadios[j].checked) {
                    item.range = eval(rangeRadios[j].value);
                }
            }
            for (j = 4 * i; j < (i + 1) * 4; j++) {
                if (speedRadios[j].checked) {
                    item.speed = eval(speedRadios[j].value);
                }
            }
            for (j = 7 * i; j < (i + 1) * 7; j++) {
                if (colorRadios[j].checked) {
                    item.color = colorRadios[j].value;
                }
            }
            item.value = input.value;
            item.time = time;

            /**
             * add danmaku info to localStorage
             */
            danmakus[i].push(item);
            localStorage.setItem("danmakus", JSON.stringify(danmakus));

            /**
             * store the danmaku
             */
            store[Object.keys(store).length] = new Danmaku(item, canvas);

            /**
             * reset the value of input box
             */
            input.value = "";
        }
    };

    /**
     * load and display the danmakus in localStorage and store
     */
    DanmakuPlayer.prototype.loadDanmaku = function () {
        /**
         * initialize
         */
        var store = this.store,
            i = this.i,
            video = document.getElementsByClassName("video")[i],
            canvas = document.getElementsByClassName("danmaku-block")[i],
            isPaused = true,
            time = video.currentTime,
            context = canvas.getContext('2d');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        /**
         * get danmakus info from localStorage
         */
        if (localStorage.getItem("danmakus")) {
            var data = JSON.parse(localStorage.getItem("danmakus"));
        } else {
            data = [];
            for (var j = 0; j < document.getElementsByClassName("video").length; j++) {
                data.push([]);
            }
        }

        /**
         * and add them to store
         */
        data[i].forEach(function (obj, index) {
            store[index] = new Danmaku(obj, canvas);
        });

        /**
         * prepare the danmakus to be loaded
         */
        function load() {
            for (var index in store) {
                var danmaku = store[index];

                if (danmaku && !danmaku.disabled && time >= danmaku.time) {
                    if (!danmaku.inited) {
                        danmaku.init();
                        danmaku.inited = true;
                    }
                    danmaku.x -= danmaku.speed;
                    if (danmaku.speed === 0) {
                        danmaku.actualX -= 2;
                    } else {
                        danmaku.actualX = danmaku.x;
                    }
                    if (danmaku.actualX < -1 * danmaku.width) {
                        danmaku.x = danmaku.actualX;
                        danmaku.disabled = true;
                    }
                    danmaku.draw();
                }
            }
        }

        /**
         * load the danmakus while not paused
         */
        function loop() {
            time = video.currentTime;
            context.clearRect(0, 0, canvas.width, canvas.height);
            load();

            if (!isPaused) {
                requestAnimationFrame(loop);
            }
        }

        /**
         * play/pause/clear danmakus when the state of playing changes
         */
        video.addEventListener('play', function () {
            isPaused = false;
            loop();
        });
        video.addEventListener('pause', function () {
            isPaused = true;
        });
        video.addEventListener('seeked', function () {
            time = video.currentTime;

            context.clearRect(0, 0, canvas.width, canvas.height);

            for (var index in store) {
                var danmaku = store[index];
                if (danmaku) {
                    danmaku.disabled = true;
                    if (time < danmaku.time) {
                        danmaku.inited = null;
                    } else {
                        danmaku.disabled = true;
                    }
                }
            }
        });
    };

    /**
     * create a floating small video window
     * @param url
     */
    DanmakuPlayer.prototype.createSmallVideo = function (url) {
        if (this.i === 0) {
            /**
             * initialize
             */
            var container = document.createElement("div"),
                move = document.createElement("button"),
                resize = document.createElement("button"),
                close = document.createElement("button"),
                smallVideo = document.createElement("video");

            container.className = "small-video-container";
            move.className = "drag-bar";
            resize.className = "resize-bar";
            close.className = "close";
            smallVideo.className = "small-video";

            move.innerHTML = "move";
            resize.innerHTML = "resize";
            close.innerHTML = "close";
            smallVideo.innerHTML = "<source src='" + url + "'>";

            /**
             * build DOM tree
             */
            container.appendChild(move);
            container.appendChild(resize);
            container.appendChild(close);
            container.appendChild(smallVideo);
            document.body.appendChild(container);
        }
    };

    /**
     * add event handlers of small video
     */
    DanmakuPlayer.prototype.setSmallVideo = function () {
        if (this.i === 0) {
            /**
             * initialize
             */
            var container = document.getElementsByClassName("small-video-container")[0],
                move = document.getElementsByClassName("drag-bar")[0],
                resize = document.getElementsByClassName("resize-bar")[0],
                close = document.getElementsByClassName("close")[0],
                smallVideo = document.getElementsByClassName("small-video")[0],
                video = document.getElementsByClassName("video")[0],
                x1, x2, y1, y2, x, w;

            /**
             * show/hide the small video window when scroll
             */
            window.addEventListener("scroll", function () {
                var toTop = video.getBoundingClientRect().top;
                if (toTop + video.offsetHeight < 0) {
                    container.style.display = "block";
                } else {
                    container.style.display = "none";
                }
            });

            /**
             * drag the small video window
             */
            move.addEventListener("mousedown", dragMouseDown);
            function dragMouseDown(e) {
                e = e || window.event;
                x2 = e.clientX;
                y2 = e.clientY;
                window.addEventListener("mousemove", elementDrag);
                window.addEventListener("mouseup", closeDragElement)
            }
            function elementDrag(e) {
                e = e || window.event;
                x1 = x2 - e.clientX;
                y1 = y2 - e.clientY;
                x2 = e.clientX;
                y2 = e.clientY;
                container.style.top = (container.offsetTop - y1) + "px";
                container.style.left = (container.offsetLeft - x1) + "px";
            }
            function closeDragElement() {
                window.removeEventListener("mouseup", closeDragElement);
                window.removeEventListener("mousemove", elementDrag);
            }

            /**
             * resize the small video window
             */
            resize.addEventListener("mousedown", resizeMouseDown);
            function resizeMouseDown(e) {
                e = e || window.event;
                x = e.clientX;
                w = smallVideo.offsetWidth;
                window.addEventListener("mousemove", elementResize);
                window.addEventListener("mouseup", closeResizeElement)
            }
            function elementResize(e) {
                e = e || window.event;
                smallVideo.style.width = (w - e.clientX + x) + "px";
                container.style.width = smallVideo.style.width;
                smallVideo.style.height = ((w - e.clientX + x) / 16 * 9) + "px";
            }
            function closeResizeElement() {
                window.removeEventListener("mouseup", closeResizeElement);
                window.removeEventListener("mousemove", elementResize);
            }

            /**
             * close the small video window
             */
            close.addEventListener("click", function () {
                if (smallVideo.style.visibility === "hidden") {
                    smallVideo.style.visibility = "visible";
                    close.innerHTML = "close";
                } else {
                    smallVideo.style.visibility = "hidden";
                    close.innerHTML = "open";
                }
            })
        }
    };

    
    window.DanmakuPlayer = function (className, i) {
        return new DanmakuPlayer(className, i);
    };
})(window);


var a = window.DanmakuPlayer("test", 1);
a.setDefaults({'color':'purple', 'speed': 1});
window.DanmakuPlayer("test", 0).initialize("video/[SumiSora][LittleBusters][SP][GB][720p].mp4");
a.initialize("video/[SumiSora][LittleBusters_Refrain][01][GB][720p].mp4");
window.DanmakuPlayer("test", 2).initialize("video/[SumiSora][LittleBusters_Refrain][02][GB][720p].mp4");

