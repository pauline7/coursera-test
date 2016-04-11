themes = {};
themeOrder = [];
var youtubeUrl = 'http://www.youtube.com/watch/?v=';
var firstCall = true;

$(document).ready(function() {

	var itemCount = 0;
	var oScrollbar = null;

	setTranslations();
	calculateArrowPosition();

	callApi();

	function setTranslations(){
		$('#view-current span.title').html(L['Grid View']);
		$('#sort-current span.title').html(L['Recently Added']);
		$('#select-grid').html(L['Grid View']);
		$('#select-list').html(L['List View']);
		$('#select-latest').html(L['Recently Added']);
		$('#select-popular').html(L['Most Popular']);
	}

	function callApi(params){

		$('.image-item:visible').remove();
		$('#image-view .overview').append('<div id="throbber"><img src="'+_RESOURCE_URL+'fancybox/fancybox_loading.gif"></div>');

		// get the current sort
		params = {order: $('#sort-list li.current a').data('sort')};

		if($.url.param('playlistID'))
		    params.playlistID = $.url.param('playlistID');   

		$.getJSON(_API_URL + 'get_music_list/', params, function(data){
			if(data.count > 0){
				itemCount = data.count;
				populateImageWrapper(data.items);
			}
		})
	}

	function populateImageWrapper(data){

		$('#throbber').remove();

		// get the current viewtype
		var type = $('#view-list li.current a').data('view');
		$('#image-wrapper').data('view', type);

		$.each(data, function(index, item){

			// store items in local storage
			themes[item.id] = item;
			themeOrder.push(item.id);

			var template = $('#image-'+type+'-template').clone();
			template.attr('id', 'bg_' + item.id);

			if(type == 'grid'){
				template.find('.grid-thumb').css('background-image', 'url(' + item.image.small + ')');
			}

			template.data('id', item.id);
			template.find('.title').html(item.Name);
			template.find('.desc').html(item.Description);
			template.find('.set').data('filename', item.Filename);
			template.find('.vote').data('filename', item.Filename);
			template.find('span.like').html(item.like);
			template.find('span.unlike').html(item.unlike);
			template.find('.image_medium').html('<image src="'+ item.image.small + '">');
			template.find('.authorname').html(item.Author);

			// check if user has already voted item
			if($.cookie('like_complete_' + item.id) !== null){
				template.find('a.like').addClass('current');
			}
			else if($.cookie('unlike_complete_' + item.id) !== null){
				template.find('a.unlike').addClass('current');
			}

			template.removeClass('hide').appendTo('#image-view .overview');

		});

		$('.image-item a.like').unbind('click').click(function(e){
			var target = $(e.target).closest('.image-item');
			voteMusic(true, target.data('id'));
			$(this).siblings('a').removeClass('current');
			$(this).addClass('current');

			if(target.hasClass('list'))
				type = 'list-view';
			else
				type = 'grid-view';
			ga('send', 'event', 'like', type, target.data('id'));
			return false;
		});

		$('.image-item a.unlike').unbind('click').click(function(e){
			var target = $(e.target).closest('.image-item');
			voteMusic(false, target.data('id'));
			$(this).siblings('a').removeClass('current');
			$(this).addClass('current');

			if(target.hasClass('list'))
				type = 'list-view';
			else
				type = 'grid-view';
			ga('send', 'event', 'unlike', type, target.data('id'));
			return false;
		});

		oScrollbar = $("#image-wrapper");
		oScrollbar.tinyscrollbar({wheel: 176, size: 523});

		$(document).bind('wheel', function(){
			calcMinimizedViewPos();
		});

		$(document).bind('drag', function(){
			calcMinimizedViewPos();
		});

		// show full view
		$('.full-view-trigger').click(function(e){

			$('.grid-thumb-play').removeClass('run');
			$(this).children('.grid-thumb-play').addClass('run');
			$('body').addClass('music-is-playing');

			$('.minimize').trigger('click');
			var target = $(e.target).closest('.image-item');

			//exclude the "set background" button and like
			if($(e.target).is('a') && $(e.target).parent().hasClass('vote'))
				return;

			getLikeStats(target.data('id'));

			var item = themes[target.data('id')];
			$('#image-preview-wrapper').data('id', target.data('id'));
			$('#image-preview-wrapper .image_preview').attr('id', 'bg_full_' + target.data('id'));
			$('#image-preview-wrapper .title').html(item.Name);
			$('#image-preview-wrapper .title').attr('title', item.Name);
			$('#image-preview-wrapper .title').attr('href', youtubeUrl + target.data('id'));
			$('#image-preview-wrapper .desc').html(item.Description);
			$('#image-preview-wrapper .set').data('filename', item.Filename);
			$('#image-preview-wrapper .vote').data('filename', item.Filename);
			$('#image-preview-wrapper span.like').html(item.like);
			$('#image-preview-wrapper span.unlike').html(item.unlike);
			$('#image-preview-wrapper .image_preview img').attr('src', item.image.large );
			$('#image-preview-wrapper .authorname').html(item.Author);
			$('#image-preview-wrapper .uploaded').html(item.TimeAgo);
			$('#image-preview-wrapper .view-count').html(item.Views);

			$('#image-preview-wrapper').find('a.like, a.unlike').removeClass('current');

			// check if user has already voted item
			if($.cookie('like_complete_' + item.Filename) !== null){
				$('#image-preview-wrapper').find('a.like').addClass('current');
			}
			else if($.cookie('unlike_complete_' + item.Filename) !== null){
				$('#image-preview-wrapper').find('a.unlike').addClass('current');
			}

			$('#image-preview-wrapper').fadeIn();

			currentTitle = target.data('id');

			var interval = setInterval(function(){
				if(typeof PLAYER != 'undefined' && typeof PLAYER.loadVideoById != 'undefined'){
					PLAYER.loadVideoById(currentTitle);
					clearInterval(interval);
				}
			}, 200);

			ga('send', 'event', 'play', item.Name);

			$('#image-preview-wrapper a.like').unbind('click').click(function(e){
				var target = $(e.target).closest('#image-preview-wrapper');
				voteMusic(true, target.data('id'));
				$(this).siblings('a').removeClass('current');
				$(this).addClass('current');
				ga('send', 'event', 'like', 'full-view', target.data('id'));
				return false;
			});

			$('#image-preview-wrapper a.unlike').unbind('click').click(function(e){
				var target = $(e.target).closest('#image-preview-wrapper');
				voteMusic(false, target.data('id'));
				$(this).siblings('a').removeClass('current');
				$(this).addClass('current');
				ga('send', 'event', 'unlike', 'full-view', target.data('id'));
				return false;
			});

		});

		// play first title in minimized mode of first call
		if(firstCall){
			firstCall = false;
			$('#image-view .image-item:visible').first().trigger('click');
		}

	}

	$('.minimize').click(function(){
		ga('send', 'event', 'minimize');
		$("#ytplayer").attr('height', 200);
		$("#ytplayer").attr('width', 354);
		$("#ytplayer").addClass('minimized');
		$('.maximize').show();
		$('.minimize').hide();
		return false;
	});

	$('.maximize').click(function(){
		ga('send', 'event', 'maximize');
		$("#ytplayer").attr('height', 430);
		$("#ytplayer").attr('width', 785);
		$("#ytplayer").removeClass('minimized');
		$('.maximize').hide();
		$('.minimize').show();
		return false;
	});

	$('.image-preview-wrapper').hover(function(){
		$('.move-down').animate({top: '+=20'}, 500);
	}, function(){
		$('.move-down').animate({top: '-=20'}, 500);
	});

	$('.dropdown-current').hover(function() {
			$(this).children('.arrow-up').stop().fadeIn();
			$(this).children('.dropdown-list').stop().fadeIn();
		},
		function() {
			$(this).children('.arrow-up').stop().fadeOut();
			$(this).children('.dropdown-list').stop().fadeOut();
	});

	$('.dropdown-list a').click(function(){

		$('.dropdown-current').trigger('mouseleave');

		// if a title is currently running, we minimize player
		if($('#image-preview-wrapper').is(':visible'))
			$('.minimize').trigger('click');

		$(this).parent().parent().siblings('a').children('.title').html($(this).html());
		$(this).parent().parent().children('li').removeClass('current');
		$(this).parent().addClass('current');
		callApi();

		if(typeof $(this).data('view') !== 'undefined'){
			$('#view-select').removeClass('grid list');
			$('#view-select').addClass($(this).data('view'));
			ga('send', 'event', 'select view', 'click', $(this).data('view'));
		}

		if(typeof $(this).data('title') !== 'undefined'){
			$('#sort-select').removeClass('latest popular');
			$('#sort-select').addClass($(this).data('title'));
			ga('send', 'event', 'select sort', 'click', $(this).data('title'));
		}
		calculateArrowPosition();
	});

	function calculateArrowPosition(){
		// set arrow position
		var offsetSort = $('#sort-current .dropdown-selector').position();
		$('#sort-current .arrow-up').css('left', offsetSort.left + 6 + 'px');
		var offsetView = $('#view-current .dropdown-selector').position();
		$('#view-current .arrow-up').css('left', offsetView.left + 6 + 'px');
		var sortWidth = $('#sort-list').width();
		$('#sort-list').css('left', offsetSort.left - sortWidth + 20 + 'px');
		var viewWidth = $('#view-list').width();
		$('#view-list').css('left', offsetView.left - viewWidth + 20 + 'px');
	}

	$(document).keyup(
		function(oEvent) {
			// preview wrapper is active
			if($('#image-preview-wrapper').is(':visible')){
				if(oEvent.which == 37){
					//left
					$('.go-left').trigger('click');
				}
				if(oEvent.which == 39){
					//right
					$('.go-right').trigger('click');
				}
			}
			if(oEvent.which == 38){
				//up
				var top = $('.overview:visible').css('top');
				top = top.substr(1, top.length -3 );
				var newTop = Number(top) - 176;
				if(newTop < 0)
					newTop = 0;
				oScrollbar.tinyscrollbar_update(newTop);

				calcMinimizedViewPos();
			}
			if(oEvent.which == 40){
				//down
				var top = $('.overview:visible').css('top');
				top = top.substr(1, top.length -3 );
				var newTop = Number(top) + 176;

				// position of last element
				limit = $('#image-view .image-item:last-child').offset().top;

				if(limit >= 560){
					oScrollbar.tinyscrollbar_update(newTop);
				}

				if(limit < 570){
					calcMinimizedViewPos();
				}

			}
		}
	);

	function voteMusic(like, item){
		filename = youtubeUrl + item;

		if(like) {
			var unlike_stat=0;
			// look if user already voted
			if($.cookie('like_complete_' + item) == null) {
				if($.cookie('unlike_complete_' + item) != null) {
					var unlike_stat = 1;
				}

				$.getJSON(_API_URL + 'set_background_stats/', {like:1, img:filename, unlike_stat:unlike_stat}, function(save_stat) {
					voteCallback(1, save_stat);
				});
			}
		} else {
			like_stat=0;
			if($.cookie('unlike_complete_' + item) == null) {
				if($.cookie('like_complete_' + item) != null) {
					var like_stat = 1;
				}

				$.getJSON(_API_URL + 'set_background_stats/',{ unlike:1, img:filename, like_stat:like_stat}, function(save_stat) {
					voteCallback(0, save_stat);
				});
			}
		}

		// closure
		function voteCallback(like, response){
			if(response == 1){
				if(like == 1) {
					$.cookie('like_complete_' + item, 'Saved',{ expires: 365});
					$.cookie('unlike_complete_' + item, null);
					$("#bg_" + item + ' .vote a.like').addClass('current');
					$("#bg_" + item + ' .vote a.unlike').removeClass('current');
					getLikeStats(item);
				} else if(like == 0){
					$.cookie('unlike_complete_' + item, 'Saved',{ expires: 365});
					$.cookie('like_complete_' + item, null);
					$("#bg_" + item + ' .vote a.unlike').addClass('current');
					$("#bg_" + item + ' .vote a.like').removeClass('current');
					getLikeStats(item);
				}
			} else {
			//        		alert('Error voting');
			}
		}

	}

	var minPos = null;
	function calcMinimizedViewPos(){

		setTimeout(function(){
			var height = parseInt($('.overview').height());
			var currentPos = $('.overview').cssInt('top');

			if((height+currentPos) <= 525){
				var newMinPos = 'top';
			}else{
				var newMinPos = 'bottom';
			}

			if(minPos != newMinPos){
				//we need to animate
				if(newMinPos == 'top'){
					$('#ytplayer').animate({top: 33});
					$('.maximize').animate({top: 50});
				} else if(newMinPos == 'bottom'){
					$('#ytplayer').animate({top: 360});
					$('.maximize').animate({top: 375});
				}
			}

			minPos = newMinPos;

		}, 100);
	}

	function getLikeStats(item) {
		filename = youtubeUrl + item;
		$.getJSON(_API_URL+'get_background_stats/?image_src='+encodeURIComponent(filename)+'&callback=?',
			function(jsondata) {
				$("#bg_" + item + ' .vote span.like').html(jsondata.no_of_like);
				$("#bg_" + item + ' .vote span.unlike').html(jsondata.no_of_unlike);
				$("#bg_full_" + item).siblings('.vote.like').find('span.like').html(jsondata.no_of_like)
				$("#bg_full_" + item).siblings('.vote.unlike').find('span.unlike').html(jsondata.no_of_unlike)
			}
		);
	}

	jQuery.fn.cssInt = function (prop) {
		return parseInt(this.css(prop), 10) || 0;
	};

	jQuery.fn.cssFloat = function (prop) {
		return parseFloat(this.css(prop)) || 0;
	};

});
