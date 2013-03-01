var Webcam = (function() {

	navigator.getMedia = ( navigator.getUserMedia ||
							navigator.webkitGetUserMedia ||
							navigator.mozGetUserMedia ||
							navigator.msGetUserMedia);
	function Webcam(onReady, onReadyScope)
	{
		this.onReady = new tools.Signal();
		this.onError = new tools.Signal();
		this.isReady = false;
		this.video = document.createElement("video");
		this.width, this.height, this.ratio;
		if(onReady)
		{
			this.onReady.add(onReady, onReadyScope);
			this.init();
		}
	}
	
	Webcam.prototype = {
		
		init : function()
		{
			navigator.getMedia({video: true}, this._onSuccess.bind(this), this._onError.bind(this));

			this.video.addEventListener('canplay', this._onReady.bind(this), false);
		},
		
		_onSuccess : function(stream)
		{
			if (navigator.mozGetUserMedia) this.video.mozSrcObject = stream;
			else
			{
				var vendorURL = window.URL || window.webkitURL;
				this.video.src = vendorURL.createObjectURL(stream);
			}
			this.video.play();
		},
		
		_onReady : function(event)
		{
			if (this.isReady) return;
			
			this.width = this.video.videoWidth;
			this.height = this.video.videoHeight;
			this.ratio = this.width / this.height;
			this.video.setAttribute('width', this.width);
			this.video.setAttribute('height', this.height);
			this.isReady = true;
			this.onReady.dispatch();
		},
		
		_onError : function(error)
		{
			this.onError.dispatch(error);
		},
		
		drawToCanvas : function(out, width, height, fit, mirror)
		{
			out.save();
			if(mirror == undefined) mirror = true;
			if(fit == undefined) fit = true;
			
			var mode = width / height >	this.ratio;
			
			var scale = width / this.width;
			if(fit == mode) scale = height / this.height;
			if(mirror)
			{
				out.scale(-1, 1);
				out.translate(-width, 0);
			}
			out.translate(0.5 * (width - scale * this.width), 0.5 * (height - scale * this.height));
			out.scale(scale, scale);
			out.drawImage(this.video, 0, 0)
			out.restore();
		}
	}

	return Webcam;
})();
