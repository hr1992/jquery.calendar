;
(function(root, factory) {
	if (typeof define === "function" && (define.amd || define.cmd)) {
		define(function(require, exports, module) {
			return factory(root, jQuery);
		});
	} else {
		factory(root, jQuery);
	}
})(window, function(root, $) {

	// 初始配置
	var defaults = {
		cellSize: 42,
		wrapClass: "calendar"
	};

	// 元素引用，期望多个日历公用一套Dom
	var $cWrap,
		$cHead,
		$cmain,
		$cFoot;

	// 月份天数索引表
	var monthsIndex = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	// 工具函数

	/**
	 * 根据月份和年计算当月天数
	 * @param  {Number} year  年
	 * @param  {Number} month 月，从0开始
	 * @return {Number}       该年该月的天数
	 */
	function calculateDays(year, month) {
		var days = monthsIndex[month];
		if (month === 1 && isLeapYear(year)) {
			days = 29;
		}
		return days;
	}

	/**
	 * 日历格子生成器
	 * @param  {Number} size 需要生成的格子数量
	 * @return {String}      格子列表字html符串
	 */
	function cellBuilder(size) {
		var rt = "<ul>",
			i,
			isLast;
		for (i = 0; i < size; i++) {
			isLast = (i + 1) % 7;
			isLastClass = isLast ? "'" : " last'";
			rt += "<li class='day" + isLastClass + "></li>";
		}
		rt += "</ul>";
		return rt;
	}

	/**
	 * 日历定位设置
	 * @param {jQuery Object} $el 需要设置定位的元素
	 * @param {Number} x   X坐标，基于整个页面
	 * @param {Number} y   y坐标，基于整个页面
	 */
	function setPosi($el, x, y) {
		$el.css({
			left: x || 0,
			top: y || 0
		});
	}

	/**
	 * 判断是不是闰年
	 * @param  {Number}  year 年份
	 * @return {Boolean}      是或者不是闰年
	 */
	function isLeapYear(year) {
		return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
	}

	/**
	 * 一位数补齐，小于2位的自动补齐为2位
	 * @param  {Number} n 任意数字
	 * @return {String}   补齐后的数字字符串
	 */
	function getTwoBit(n) {
		return (n > 9 ? "" : "0") + n
	}

	/*
	 * 日期对象转成字符串
	 * @param  {Date} new Date()
	 * @split  {String} "-" 或 "/"
	 * @return {String} "2014-12-31"
	 */
	function date2Str(date, split) {
		split = split || "-";
		var y = date.getFullYear();
		var m = getTwoBit(date.getMonth() + 1);
		var d = getTwoBit(date.getDate());
		return [y, m, d].join(split);
	}

	/**
	 * 字符串转Date对象
	 * @param  {String} str 日期字符串
	 * @return {Date}     日期对象
	 */
	function str2Date(str) {
		var reDate = /^\d{4}\-\d{1,2}\-\d{1,2}/;
		if (reDate.test(str)) {
			str = str.replace(/-/g, "/");
			/* 
			直接通过"-"在日期构造器里面使用，会出现兼容性问题
			http://my.oschina.net/epstar/blog/289949
			http://www.cnblogs.com/snandy/p/3992443.html
			*/
		}
		return new Date(str);
	}

	/**
	 * 填充日历
	 * @param  {jq Object} $el   待填充格子的父级元素
	 * @param  {Number} year  年
	 * @param  {Number} month 月
	 */
	function fillCell($el, year, month) {
		var days = calculateDays(year, month);
		var monthStartDay = new Date(year, month, 1);
		var startDay = monthStartDay.getDay();

		var $lis = $el.find("li");
		$lis.removeData("day").text("");
		for (var i = 0; i < days; i++) {
			$lis.eq(i + startDay).data("day", i + 1).text(i + 1);
		}

	}

	/**
	 * 格式化输出
	 * @param  {jq Object} $el   填充格式化后的结果的元素，一般为Input
	 * @param  {Number} year  年
	 * @param  {Number} month 月
	 * @param  {Number} day   日
	 */
	function putOut($el, year, month, day) {
		$el.val(year + "-" + getTwoBit(month + 1) + "-" + getTwoBit(day));
	}

	/**
	 * 界面更新
	 * @param  {jq Object} $el   需要更新的界面jq对象
	 * @param  {Number} year  更新成该年
	 * @param  {Number} month 更新成该月
	 */
	function update($input, $el, year, month) {
		var $year = $el.find(".primary .year"),
			$month = $el.find(".primary .month");

		$year.text(year);
		$month.text(getTwoBit(month + 1));
		$input.data("year", year).data("month", month);
	}


	jQuery.fn.extend({
		calendar: function(options) {
			var opts = $.extend({}, defaults, options);
			var $input = $(this);
			var offset = $input.offset();

			// 初始元素 
			$cWrap = $("<div class='" + opts.wrapClass + "'></div>");
			$cHead = $(
				"<div class='head'>\
					<div class='primary'>\
						<a href='javascript:;' class='prev ion-arrow-left-b'></a>\
						<span class='year'>2015</span>年\
						<span class='month'>05</span>月\
						<a href='javascript:;' class='next ion-arrow-right-b'></a>\
					</div>\
					<div class='secondary'>\
						<ul class='weeks'>\
							<li>日</li>\
							<li>一</li>\
							<li>二</li>\
							<li>三</li>\
							<li>四</li>\
							<li>五</li>\
							<li>六</li>\
						</ul>\
					</div>\
				</div>"
			);
			$cmain = $("<div class='main'></div>");
			$cFoot = $("<div class='foot'></div>");
			var $year = $cHead.find(".primary .year"),
				$month = $cHead.find(".primary .month");

			// 填充日历格子，数量可控 
			var cellStr = cellBuilder(opts.cellSize);
			$cmain.html(cellStr);

			var handles = {
				show: function(ev) {
					var now = new Date(),
						year = now.getFullYear(),
						month = now.getMonth();
					$cWrap.fadeIn(200);
					update($input, $cWrap, year, month);
					fillCell($cmain, year, month);
					return false;
				},
				hide: function() {
					$cWrap.fadeOut(200);
					return false;
				},
				next: function() {
					var lastYear = +$input.data("year"),
						lastMonth = +$input.data("month");

					var year, month;

					if (lastMonth >= 11) {
						year = lastYear + 1;
						month = 0;
					} else {
						year = lastYear;
						month = lastMonth + 1;
					}
					update($input, $cWrap, year, month);
					fillCell($cmain, year, month);

				},
				prev: function() {
					var lastYear = +$input.data("year"),
						lastMonth = +$input.data("month");

					var year, month;

					if (lastMonth <= 0) {
						year = lastYear - 1;
						month = 11;
					} else {
						year = lastYear;
						month = lastMonth - 1;
					}
					update($input, $cWrap, year, month);
					fillCell($cmain, year, month);
				}
			}

			// 组合Calendar，并隐藏放到body下
			$cWrap.append($cHead, $cmain, $cFoot).hide().appendTo("body");
			// 设置日历的定位
			setPosi($cWrap, opts.x || offset.left, opts.y || offset.top + $input.outerHeight());



			// 事件绑定
			$input.on("focus", handles.show);
			$(document).on("click", function(ev) {
				if (!$(ev.target).closest("." + opts.wrapClass).length && $(ev.target)[0] !== $input[0]) {
					handles.hide();
				}
			});
			$cWrap.on("click", ".day", function() {
				var day = +$(this).data("day");
				var year = +$input.data("year");
				var month = +$input.data("month");

				if (!day) {
					return false;
				}
				putOut($input, year, month, day);
				handles.hide();
			});

			$cHead.on("click", ".prev", handles.prev);
			$cHead.on("click", ".next", handles.next);

		}
	});

});