var services = (function(){
	
	function DataLoader(url)
	{
		this.init(url);
	}
	
	DataLoader.prototype = {
		
		useCache:true,
		POST:{},
		GET:{},
		errors : [],
		responseType:"text",
		
		init : function(url)
		{
			this.url = url;
			this.onComplete = new tools.Signal();
			this.onProgress = new tools.Signal();
			this.onError = new tools.Signal();
		
			this.request = new XMLHttpRequest();
			this._addListener("progress", this._onProgress);
			this._addListener("load", this._onData);
			this._addListener("error", this._onError);
			this._addListener("abort", this._onError);
		},
		
		_addListener : function(type, listener)
		{
			this.request.addEventListener(type, listener.bind(this));
		},
	
		load : function(completeCallback, completeScope, errorCallback, errorScope)
		{
			if(completeCallback) this.onComplete.add(completeCallback, completeScope);
			if(errorCallback) this.onError.add(errorCallback, errorScope);
			var url = this.url;
			
			var getString = this._varsToString(this.GET);
			if(getString.length)
				url = this._urlAppendVars(url, getString);
				
			if(!this.useCache)
				url = this._urlAppendVars(url, new Date().getTime());
			
			this.request.open('POST', this.url);
			this.request.responseType = this.responseType;
			this.request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			this.request.send(this._varsToString(this.POST));
		},
		
		_urlAppendVars : function(url, vars)
		{
			return url + ((/\?/).test(url) ? "&" : "?") + vars;
		},
		
		_onProgress : function () { this.onProgress.dispatch(this); },
		
		_onData : function() { this.parse(); },
		
		_onError : function() { this.onError.dispatch(this); },
		
		_varsToString : function(vars)
		{
			var str = "";
			var i = 0;
			for(var key in vars)
			{
				if(i++)str += "&";
				str += key + "=" + vars[key];
			}
			return str;
		},
		
		parse : function()
		{
			this.data = this.request.response
			this._onParsed();
		},
		
		_onParsed : function() { this.onComplete.dispatch(this); }
	}

	function GroupLoader()
	{
		this.data = {};
		this.loaders = {};
		this._queue;	
		this._currentID;
		this._queueLength = 3;
		this.loaded = 0;
		this.loadedRatio;

		this.onComplete = new tools.Signal();
		this.onProgress = new tools.Signal();
		this.onError = new tools.Signal();
	}

	GroupLoader.prototype = {
		load : function(completeCallback, completeScope, errorCallback, errorScope)
		{
			if(completeCallback) this.onComplete.add(completeCallback, completeScope);
			if(errorCallback) this.onError.add(errorCallback, errorScope);
			this._queue = [];
			this._currentID = 0;
			this.loaded = 0;
			for(var name in this.loaders)
			{
				var loader = this.loaders[name];
				this._queue.push(loader);
				loader.onComplete.add(this._onLoaderComplete, this, name);
			}
			var n = Math.min(this._queueLength, this._queue.length);
			for(var i = 0; i < n; i++) this._loadNext();
		},

		_loadNext : function()
		{
			var nextLoader = this._queue[this._currentID];
			this._currentID++;
			nextLoader.onError.add(this._onError, this);
			nextLoader.onProgress.add(this._onProgress, this);
			nextLoader.load();
		},

		_onLoaderComplete : function(loader, name)
		{
			this.loaded++;
			this.loadedRatio = this.loaded / this._queue.length;
			this.data[name] = loader.data;
			if(this._currentID < this._queue.length) this._loadNext();
			else if(this.loaded == this._queue.length) this.onComplete.dispatch(this);
		},

		_onError : function(loader)
		{
			this.errors = loader.errors;
			this.onError.dispatch(this);
		},

		_onProgress : function()
		{
			this.onProgress.dispatch(this);
		}
	}


	function ImageLoader(url)
	{
		this.responseType = "blob";
		this.init(url);
	}
	
	ImageLoader.prototype = {

		parse : function()
		{
			this.data =  new Image();
			this.data.src = window.URL.createObjectURL(this.request.response);;
			this._onParsed()
		}
	}
	
	ImageLoader.prototype.__proto__ = DataLoader.prototype;

	return {DataLoader:DataLoader, 
			GroupLoader:GroupLoader,
			ImageLoader:ImageLoader};
})();


/*
var gpl = new services.GroupLoader();
gpl.loaders.shader = new services.DataLoader("shaders/vertexShader.glsl");
gpl.loaders.image = new services.ImageLoader("img/test.jpg");
gpl.load(_onGpl, this);

function _onGpl(loader)
{
	shader = loader.data.shader;
	image = loader.data.image;
	//...
}


new services.ImageLoader("img/test.jpg").load(onImage, this);
function onImage(loader)
{
	console.log(loader.data);
}

*/