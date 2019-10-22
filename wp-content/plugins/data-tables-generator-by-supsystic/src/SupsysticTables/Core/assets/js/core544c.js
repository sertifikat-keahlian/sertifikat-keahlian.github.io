if(typeof(SDT_DATA) == 'undefined') {
	var SDT_DATA = {};
}

(function (vendor, $, window) {

	var appName = 'Tables';
	var dataTableInstances = [];

	if (!(appName in vendor)) {
		vendor[appName] = {};

		vendor[appName].getAppName = (function getAppName() {
			return appName;
		});

		vendor[appName].getAllTableInstances = (function getAllTableInstances() {
			return dataTableInstances;
		});

		vendor[appName].setTableInstance = (function setTableInstance(instance) {
			dataTableInstances.push(instance);
		});

		vendor[appName].getTableInstanceById = (function getTableInstanceById(id) {
			var allTables = vendor[appName].getAllTableInstances();

			for(var i = 0; i < allTables.length; i++) {
				if(allTables[i].table_id == id) {
					return allTables[i];
				}
			}
			return false;
		});

		vendor[appName].request = (function request(route, data) {
			if (!$.isPlainObject(route) || !('module' in route) || !('action' in route)) {
				throw new Error('Request route is not specified.');
			}

			if (!$.isPlainObject(data)) {
				data = {};
			}

			if ('action' in data) {
				throw new Error('Reserved field "action" used.');
			}

			data.action = 'supsystic-tables';

			var url = window.ajaxurl ? window.ajaxurl : ajax_obj.ajaxurl,
				request = $.post(url, $.extend({}, { route: route }, data)),
				deferred = $.Deferred();

			request.done(function (response, textStatus, jqXHR) {
				if (typeof response.success !== 'undefined' && response.success) {
					deferred.resolve(response, textStatus, jqXHR);
				} else {
					var message = 'There are errors during the request.';

					if (typeof response.message !== 'undefined') {
						message = response.message;
					}

					deferred.reject(message, textStatus, jqXHR);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				deferred.reject(errorThrown, textStatus, jqXHR);
			});

			return deferred.promise();
		});

		vendor[appName].getParameterByName = (function getParameterByName(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);

			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		});

		vendor[appName].replaceParameterByName = (function (url, paramName, paramValue) {
			var pattern = new RegExp('\\b('+paramName+'=).*?(&|$)');
			if (url.search(pattern) >= 0) {
				return url.replace(pattern,'$1' + paramValue + '$2');
			}
			return url + (url.indexOf('?')>0 ? '&' : '?') + paramName + '=' + paramValue;
		});

		vendor[appName].createSpinner = (function createSpinner (elem) {
			elem = typeof(elem) != 'undefined' ? elem : false;

			if(elem) {
				var icon = elem.find('.fa');

				if(icon) {
					icon.data('icon', icon.attr('class'));
					icon.attr('class', 'fa fa-spinner fa-spin');
				}
			} else {
				return $('<i/>', { class: 'fa fa-spinner fa-spin' });
			}
		});

		vendor[appName].deleteSpinner = (function deleteSpinner (elem) {
			var icon = elem.find('.fa');

			if(icon) {
				icon.attr('class', icon.data('icon'));
				icon.data('icon', '');
			}
		});

		vendor[appName].initializeTable = (function initializeTable(table, callback, finalCallback) {
			var $table = (table instanceof $ ? table : $(table)),
				features = $table.data('features'),
				config = {},
				translation = {},
				language = $table.data('lang'),
				override = $table.data('override'),
				responsiveMode = $table.data('responsive-mode'),
				searchingSettings = $table.data('searching-settings'),
				tableInstance = {},
				defaultFeatures = {
					autoWidth:  false,
					info:       false,
					ordering:   false,
					paging:     false,
					responsive: false,
					searching:  false,
					stateSave:  false,
					api: 		true,
					initComplete: callback,
					headerCallback: function( thead, data, start, end, display ) {
						$(thead).find('th').each(function() {
							setStylesToCell(this);
						});
					},
					footerCallback: function( tfoot, data, start, end, display ) {
						$(tfoot).find('th').each(function() {
							setStylesToCell(this);
						});
					}
				};

			/* custom sort start */
			$.extend( $.fn.dataTableExt.oSort, {
				"natural-asc": function ( a, b ) {
					return naturalSort(a,b,true);
				},

				"natural-desc": function ( a, b ) {
					return naturalSort(a,b,true) * -1;
				},

				"natural-nohtml-asc": function( a, b ) {
					return naturalSort(a,b,false);
				},

				"natural-nohtml-desc": function( a, b ) {
					return naturalSort(a,b,false) * -1;
				},

				"natural-ci-asc": function( a, b ) {
					a = a.toString().toLowerCase();
					b = b.toString().toLowerCase();

					return naturalSort(a,b,true);
				},

				"natural-ci-desc": function( a, b ) {
					a = a.toString().toLowerCase();
					b = b.toString().toLowerCase();

					return naturalSort(a,b,true) * -1;
				},

				"natural-nohtml-ci-asc": function( a, b ) {
					a = a.toString().toLowerCase();
					b = b.toString().toLowerCase();

					return naturalSort(a,b,false);
				},

				"natural-nohtml-ci-desc": function( a, b ) {
					a = a.toString().toLowerCase();
					b = b.toString().toLowerCase();

					return naturalSort(a,b,false) * -1;
				}
			} );
			/* custom sort end */

			$.each(features, function () {
				var featureName = this.replace(/[-_]([a-z])/g, function (g) { return g[1].toUpperCase(); });
				config[featureName] = true;
			});
			if (toeInArray('searching', features) != -1 && searchingSettings) {
				if (searchingSettings.minChars > 0 ||
					searchingSettings.resultOnly ||
					searchingSettings.strictMatching
				) {

					$.fn.dataTable.ext.search.push(function(settings, data) {
						var $searchInput = $(settings.nTableWrapper).find('.dataTables_filter input'),
							searchValue = $searchInput.val();

						if (searchingSettings.resultOnly && searchValue.length === 0) {
							if (searchingSettings.showTable) {
								return false;
							}
							return false;
						}
						if (searchingSettings.strictMatching) {
							searchValue = $.fn.dataTable.util.escapeRegex(searchValue);
							var regExp = new RegExp('^' + searchValue, 'i');

							for (var i = 0; i < data.length; i++) {
								var words = data[i].replace(/\s\s+/g, ' ').split(' ');

								for (var j = 0; j < words.length; j++) {
									if (words[j].match(regExp)) {
										return true;
									}
								}
							}
							return false;
						} else {
							return data.join(' ').toLowerCase().indexOf(searchValue.toLowerCase()) !== -1
						}
					});
					$table.on('init.dt', function (event, settings)  {
						if (!settings) {
							return;
						}

						var $tableWrapper = $(settings.nTableWrapper),
							$tableSearchInput = $tableWrapper.find('.dataTables_filter input'),
							$customInput = $tableSearchInput.clone();

						$tableSearchInput.replaceWith($customInput);

						$customInput.on('input change', function() {
							if (!searchingSettings.showTable) {
								if (searchingSettings.resultOnly && searchingSettings.minChars && (this.value.length < searchingSettings.minChars || !this.value.length)) {
									$table.hide();
									$table.parent().find('.dataTables_paginate').hide();
								} else {
									$table.show();
									$table.parent().find('.dataTables_paginate').show();
								}
							}
							if (searchingSettings.minChars && (this.value.length < searchingSettings.minChars && this.value.length !== 0)) {
								event.preventDefault();
								return false;
							}
							$table.api().draw();
						});

						if (searchingSettings.resultOnly && !searchingSettings.showTable) {
							$table.hide();
							$table.parent().find('.dataTables_paginate').hide();
						}

					});
				}
			}
			if (toeInArray('ordering', features) != -1) {
				var sortingEnable = ['_all'],
					sortingDisable = [],
					aaSorting = [],
					multipleSorting = $table.data('multiple-sorting'),
					disableSorting = $table.data('disable-sorting');

				if (!$table.data('head')) {
					sortingDisable = ['_all'];
				}
				if(disableSorting && disableSorting.length) {
					sortingDisable = disableSorting;
				}
				if (multipleSorting && multipleSorting.length) {
					aaSorting = multipleSorting;
				} else {
					var columnsCount = $table.find('tr:first th').length,
						sortColumn = $table.data('sort-column') || 0,
						sortOrder = $table.data('sort-order') || 'asc',
						columnNumber = sortColumn - 1;

					if(columnNumber >= 0 && columnNumber < columnsCount) {
						aaSorting.push([columnNumber, sortOrder]);
					}
				}
				config.aoColumnDefs = [
					{ aType: 'natural-nohtml-ci', aTargets: '_all' },
					{ "bSortable": false, "aTargets": sortingDisable },
					{ "bSortable": true, "aTargets": sortingEnable }
				];
				config.aaSorting = aaSorting;
			}
			if ($table.data('pagination-length')) {
				var aLengthMenu = [];
				var paginationLength = String($table.data('pagination-length'));
				aLengthMenu.push(paginationLength.replace('All', -1).split(',').map(Number));
				aLengthMenu.push(paginationLength.split(','));
				config.aLengthMenu = aLengthMenu;
			}
			if ($table.data('auto-index') && $table.data('auto-index') !== 'off') {
				config.fnRowCallback = function(nRow, aData, iDisplayIndex) {
					$("td:first", nRow).html(iDisplayIndex +1);
					return nRow;
				};
			}
			if (responsiveMode == 0) {
				// Responsive Mode: Standart Responsive Mode
				var labelStyles = '<style>',
					id = '#' + $table.attr('id');

				$table.find('thead th').each(function(index, el) {
					labelStyles += id + '.oneColumnWithLabels td:nth-of-type(' + (index + 1) + '):before { content: "' + $(this).text() + '"; }';
				});
				labelStyles += '</style>';
				$table.append(labelStyles);

				$(window).on('resize', $table, function(event) {
					event.preventDefault();

					clearTimeout($table.data('resizeTimer'));

					$table.data('resizeTimer', setTimeout(function() {
						$table.removeClass('oneColumn oneColumnWithLabels');
						var tableWidth = $table.width(),
							wrapperWidth = $table.closest('.supsystic-tables-wrap').width();
						if (tableWidth > wrapperWidth) {
							$table.addClass('oneColumn');

							if ($table.data('head') == 'on') {
								$table.addClass('oneColumnWithLabels');
							}
						}
					}, 150));

				}).trigger('resize');
			} else if (responsiveMode === 1) {
				// Responsive Mode: Automatic Column Hiding
				config.responsive = {
					details: {
						renderer: function (api, rowIdx, columns) {
							var $table = $(api.table().node()),
								$subTable = $('<table/>');

							$.each(columns, function (i, col) {
								if (col.hidden) {
									var $cell = $(api.cell(col.rowIndex, col.columnIndex).node()),
										markup = '<tr data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">';
									if ($table.data('head') == 'on') {
										var $headerContent = $(api.table().header()).find('th').eq(col.columnIndex).html();
										markup += '<td>';
										if ($headerContent) {
											markup += $headerContent;
										}
										markup += '</td>';
									}
									markup += '</tr>';
									$cell.after(
										$('<td>')
											.addClass('collapsed-cell-holder')
											.attr('data-cell-row', col.rowIndex)
											.attr('data-cell-column', col.columnIndex)
											.hide()
									);
									$subTable.append($(markup).append($cell.addClass('collapsed').show()));
								}
							});
							return $subTable.is(':empty') ? false : $subTable;
						}
					}
				};
				$table.on('responsive-resize.dt', function(event, api, columns) {
					if ($table.width() > $table.parent().width()) {
						api.responsive.recalc();
						return;
					}
					for (var i = 0, len = columns.length; i < len; i++) {
						if (columns[i]) {
							$table.find('tr > td.collapsed-cell-holder[data-cell-column="' + i + '"]').each(function(index, el) {
								var $this = $(this);
								var $cell = $(api.cell(
									$this.data('cell-row'),
									$this.data('cell-column')
								).node());

								if ($cell.hasClass('collapsed')) {
									$cell.removeClass('collapsed');
									$this.replaceWith($cell);
								}
							});
						}
					}
				});
			} else if (responsiveMode === 2) {
				// Responsive Mode: Horizontal Scroll
				config.scrollX = true;
			}
			if(responsiveMode === 2 || responsiveMode === 3) {
				var fixedLeft = $table.data('fixed-left'),
					fixedRight = $table.data('fixed-right');

				config.fixedHeader = {
					header: false,
					footer: false
				};
				if ($table.data('head') && $table.data('fixed-head')) {
					config.fixedHeader.header = true;
				}
				if ($table.data('foot') && $table.data('fixed-foot')) {
					config.fixedHeader.footer = true;
				}
				if(config.fixedHeader.header || config.fixedHeader.footer) {
					config.scrollY = $table.data('fixed-height');
					config.scrollCollapse = true;
				}
				if ($table.data('fixed-cols')) {
					config.fixedColumns = {
						leftColumns: fixedLeft ? parseInt(fixedLeft) : 0,
						rightColumns: fixedRight ? parseInt(fixedRight) : 0
					};
					config.scrollX = true;
				}
			}

			$.fn.dataTableExt.oApi.fnFakeRowspan = function (oSettings) {
				$.each(oSettings.aoData, function(index, rowData) {
					setCellAttributes(rowData.anCells);
				});

				if (oSettings.aoHeader.length) {
					cells = [];
					$.each(oSettings.aoHeader, function(index, rowData) {
						$.each(rowData, function(index, cellData) {
							cells.push(cellData.cell);
						});
					});
					setCellAttributes(cells);
				}
				if (oSettings.aoFooter.length) {
					cells = [];
					$.each(oSettings.aoFooter[0], function(index, cellData) {
						cells.push(cellData.cell);
					});
					setCellAttributes(cells);
				}
				return this;
			};
			_checkOnClickPopups();
			if (language.length ) {
				if(language == 'browser') {
					var browserLang = navigator.language;

					language = g_stbTblLang && g_stbTblLang[browserLang] ? g_stbTblLang[browserLang] : 'default';
				}
				if(language !== 'default') {
					$.get('//cdn.datatables.net/plug-ins/1.10.15/i18n/'+ language +'.json')
						.done(function (response) {
							translation = response;
						}).always(function () {
							$.each(override, function (key, value) {
								if (value.length) {
									translation[key] = value;
									// We need to support old DT format, cuz some languages use it
									translation['s' + key.charAt(0).toUpperCase() + key.substr(1)] = value;
								}
							});
							config.language = translation;
							tableInstance = $table.dataTable($.extend({}, defaultFeatures, config));
							tableInstance.table_id = $table.data('id');
							tableInstance.fnFakeRowspan();
							vendor[appName].setTableInstance(tableInstance);

							if(typeof finalCallback  == "function") {
								return finalCallback(tableInstance);
							} else {
								return tableInstance;
							}
						});
				} else {
					$.each(override,function(key,value) {
						if(value.length) {
							translation[key] = value;
							// We need to support old DT format, cuz some languages use it
							translation['s' + key.charAt(0).toUpperCase() + key.substr(1)] = value;
						}
					});
					config.language = translation;
					tableInstance = $table.dataTable($.extend({},defaultFeatures,config));
					tableInstance.table_id = $table.data('id');
					tableInstance.fnFakeRowspan();
					vendor[appName].setTableInstance(tableInstance);

					if(typeof finalCallback  == "function") {
						return finalCallback(tableInstance);
					} else {
						return tableInstance;
					}
				}
			}
		});

		// Callback for displaying table after initializing
		vendor[appName].showTable = (function showTable (table) {
			var $table = (table instanceof $ ? table : $(table)),
				$tableWrap = $table.closest('.supsystic-tables-wrap'),
				$customCSS = $('#' + table.attr('id') + '-css'),
				afterTableLoadedScriptString = $table.attr('data-after-table-loaded-script'),
				_ruleJS = new ruleJS($tableWrap.attr('id')),
				responsiveMode = $table.data('responsive-mode');

			// Custom CSS
			$table.bind('column-visibility.dt draw.dt', function (e) {
				$(this).find('td, th').each(function () {
					setStylesToCell(this);
				});
			});
			if ($customCSS.length) {
				$('head').append($('<style/>', { type: 'text/css', id: 'sdbTableStyles_' + $table.data('view-id') }).text($customCSS.text()));
				$customCSS.remove();
			}

			// Do not know why we do this
			if (!$table.data('head')) {
				$table.find('th').removeClass('sorting sorting_asc sorting_desc sorting_disabled');
			}

			// Calculate formulas
			_ruleJS.init();

			// Set formats
			vendor[appName].formatDataAtTable($table);
			$(document).on('click', '.paginate_button', function () {
				vendor[appName].formatDataAtTable($table);
			});

			// Show comments on tap
			if ('ontouchstart' in window || navigator.msMaxTouchPoints) {
				table.find('td, th').on('click', function(e) {
					var $this = $(this),
						title = $this.attr('title');

					if (title) {
						var div = $('<div style="display:none;' +
						'position:absolute;' +
						'border-radius:6px;' +
						'background-color:#999;' +
						'color:white;' +
						'padding:7px;"/>');

						div.text(title)
							.appendTo('body')
							.css('top', (e.pageY - 70) + 'px')
							.css('left', (e.pageX + 20) + 'px')
							.fadeIn('slow');

						setTimeout(function() {
							div.fadeOut();
						}, 1200);

					}
				});
			}

			// Editable fields
			if (typeof(vendor[appName].createEditableFields) == 'function') {	// for compatibility with old pro versions
				var $editableFields = $table.find('.editable'),
					$tableId = $table.data('id'),
					useEditableFields = typeof(useEdit) != 'undefined' && typeof(useEdit[$tableId]) != 'undefined' ? useEdit[$tableId] : false;

				if ($editableFields.length) {
					if(useEditableFields) {
						vendor[appName].setEditableFields($table, $editableFields);
					} else if(SDT_DATA.isAdmin && SDT_DATA.isPro) {
						vendor[appName].createEditableFields($table, $editableFields);
					}
					$table.on('init.dt', function() {
						$table.on('draw.dt', function() {
							$editableFields.off('click.sup');
							vendor[appName].updateAfterRedraw($table);
						});
					});
				}
			}

			// Show table
			$tableWrap.prev('.supsystic-table-loader').hide();
			$tableWrap.css('visibility', 'visible');

			// Set timeout because for correct work of function table must be already visible
			setTimeout(function() {
				vendor[appName].fixSortingForMultipleHeader($table);

				if($table.data('fixed-head')) {
					var tableWrapper = $table.closest('.supsystic-tables-wrap'),
						i = 1;

					tableWrapper.find('.dataTables_scrollBody table thead tr:first-child th').each(function() {
						var thWidth = tableWrapper.find('.dataTables_scrollHead table thead tr:first-child th:nth-child('+ i + ')');

						$(this).css({ 'min-width': thWidth.width() });
						i++;
					});
				}
			}, 100);

			// Load user custom scripts
			if (afterTableLoadedScriptString !== undefined) {
                afterTableLoadedScriptString = afterTableLoadedScriptString.substring(1, afterTableLoadedScriptString.length - 1);

				var afterTableLoadedScript = b64DecodeUnicode(afterTableLoadedScriptString).replace(/"/g, "'"),
					executeScript = new Function(afterTableLoadedScript);

				if (typeof executeScript === "function") {
                    setTimeout(function() {
						executeScript();
                    }, 1000);
				}
			}

			function b64DecodeUnicode(str) {
				return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				}).join(''));
			}
		});

        // Callback for executing script after table is initialized
        vendor[appName].executeScript = (function executeScript (table) {
            var $table = (table instanceof $ ? table : $(table)),
                $tableWrap = $table.closest('.supsystic-tables-wrap'),
                _ruleJS = new ruleJS($tableWrap.attr('id'));

            _ruleJS.init();
            $tableWrap.prev('.supsystic-table-loader').hide();
            $tableWrap.css('visibility', 'visible');
        });
		vendor[appName].fixSortingForMultipleHeader = function (table) {
			if(table.data('head-rows-count') > 1 && table.data('sort-order')) {
				var thead = table.find('thead tr').get().reverse();

				// Fix of sorting for table with multiple header (when header has more than 1 row)
				if(table.data('head')) {
					$.each(table.find('thead tr:last-child th'), function (index, element) {
						var th = $(element),
							nthChild = index + 1;

						if(!th.is(':visible')) {
							$(thead).each(function() {
								var item = $(this).find('th:nth-child(' + nthChild + ')');

								if(item.is(':visible')) {
									item.addClass('sorting');
									item.click(function() {
										th.trigger('click');
									});
									return false; // stop .each() function
								}
							});
						}
					});
				}
				// Fix of displaying the footer if table has multiple header
				if(table.data('foot')) {
					var newFooter = [];

					$.each(table.find('tfoot tr th'), function (index, element) {
						var nthChild = index + 1;

						$(thead).each(function() {
							var item = $(this).find('th:nth-child(' + nthChild + ')');

							if(item.is(':visible')) {
								newFooter.push(item.clone());
								return false; // stop .each() function
							}
						});

					});
					table.find('tfoot').html(newFooter);
				}
			}
		};

		vendor[appName].isNumber = function isNumber(value) {
			if (value) {
				if (value.toString().match(/^-{0,1}\d+\.{0,1}\d*$/)) {
					return true;
				}
			}

			return false;
		};

		vendor[appName].formatDataAtTable = function formatDataAtTable(table) {
			var numberFormat = table.data('number-format'),
				generalCurrencyFormat = table.data('currency-format'),
				generalPercentFormat = table.data('percent-format'),
				generalDateFormat = table.data('date-format'),
				skipFirstCol = table.data('auto-index') != 'off',
				hasCollapsedCells = table.data('responsive-mode') == 1 && table.hasClass('collapsed');

			table.find('td').each(function(index, el) {
				var $this = $(this);

				if((skipFirstCol && $this.is(':first-child')) || (hasCollapsedCells && $this.hasClass('child'))) {
					// Break current .each ineration
					return;
				}

				var languageData = numeral.languageData(),
					format = $this.data('cell-format'),
					formatType = $this.data('cell-format-type'),
					preparedFormat,
					delimiters,
					value = $.trim($this.html()),
					noFormat = false;

				if(value && value.toString().match(/^-{0,1}\d+\.{0,1}\d*$/) && !isNaN(value)) {
					numberFormat = numberFormat ? numberFormat.toString() : '';

					switch(formatType) {
						case 'percent':
							format = format ? format : generalPercentFormat;

							if(format) {
								format = format.toString();

								var clearFormat = format.indexOf('%') > -1 ? format.match(/\d.?\d*.?\d*/)[0] : format;

								value = value.indexOf('%') > -1 ? $this.data('original-value') : value;
								delimiters = (clearFormat.match(/[^\d]/g) || [',', '.']).reverse();
								languageData.delimiters = {
									decimal: delimiters[0], thousands: delimiters[1]
								};

								// We need to use dafault delimiters for format string
								preparedFormat = format.replace(clearFormat, clearFormat.replace(delimiters[0], '.').replace(delimiters[1], ','));
							} else {
								noFormat = true;
							}
							break;
						case 'currency':
							format = format ? format : generalCurrencyFormat;

							if(format) {
								format = format.toString();

								var formatWithoutCurrency = format.match(/\d.?\d*.?\d*/)[0],
									currencySymbol = format.replace(formatWithoutCurrency, '') || '$';	// We need to set currency symbol in any case for normal work of numeraljs

								delimiters = (formatWithoutCurrency.match(/[^\d]/g) || [',', '.']).reverse();

								languageData.delimiters = {
									decimal: delimiters[0],
									thousands: delimiters[1]
								};
								languageData.currency.symbol = currencySymbol;
								// We need to use dafault delimiters for format string
								preparedFormat = format
									.replace(formatWithoutCurrency, formatWithoutCurrency
										.replace(delimiters[0], '.')
										.replace(delimiters[1], ','))
									.replace(currencySymbol, '$');
							} else {
								noFormat = true;
							}
							break;
						case 'date':
							noFormat = true;
							break;
						default:
							if(numberFormat) {
								format = numberFormat;
								delimiters = (format.match(/[^\d]/g) || [',', '.']).reverse();
								languageData.delimiters = {
									decimal: delimiters[0]
								,	thousands: delimiters[1]
								};

								// We need to use dafault delimiters for format string
								preparedFormat = format.replace(format, format.replace(delimiters[0], '.').replace(delimiters[1], ','));
								break;
							} else {
								noFormat = true;
							}
							break;
					}

					if(noFormat) {
						noFormat = false;
					} else {
						numeral.language('en', languageData);
						value = numeral(value).format(preparedFormat);
					}
				} else if(value && formatType == 'date' && $this.data('cell-reformat')) {
					var newDate = moment(value, format);
					// console.log(newDate);

					if (newDate.isValid()) {
						value = newDate.format(generalDateFormat);

						$this.data('cell-format', generalDateFormat);
						$this.attr('data-cell-format',generalDateFormat);

						$this.data('original-value', value);
						$this.attr('data-original-value',value);

						$this.data('order', value);
						$this.attr('data-order',value);

						$this.data('cell-reformat', false);
						$this.attr('data-cell-reformat',value);
					}
				}

				$this.html(value);
			});
		};

		vendor[appName].Base64 = {
			_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
			encode : function (input) {
				var output = "";
				var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
				var i = 0;

				input = vendor[appName].Base64._utf8_encode(input);

				while (i < input.length) {

					chr1 = input.charCodeAt(i++);
					chr2 = input.charCodeAt(i++);
					chr3 = input.charCodeAt(i++);

					enc1 = chr1 >> 2;
					enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
					enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
					enc4 = chr3 & 63;

					if (isNaN(chr2)) {
						enc3 = enc4 = 64;
					} else if (isNaN(chr3)) {
						enc4 = 64;
					}

					output = output +
					this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
					this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

				}

				return output;
			},
			// private method for UTF-8 encoding
			_utf8_encode : function (string) {
				string = string.replace(/\r\n/g,"\n");
				var utftext = "";

				for (var n = 0; n < string.length; n++) {

					var c = string.charCodeAt(n);

					if (c < 128) {
						utftext += String.fromCharCode(c);
					}
					else if((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					}
					else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}

				}

				return utftext;
			}
		};
	}
	reviewNoticeResponse();

}(window.supsystic = window.supsystic || {}, window.jQuery, window));

// Apply styles to cell from its classes
function setStylesToCell(cell) {
	var color = /color\-([0-9abcdef]{6})/.exec(cell.className),
		background = /bg\-([0-9abcdef]{6})/.exec(cell.className);

	if (null !== color) {
		jQuery(cell).css({color: '#' + color[1]});
	}
	if (null !== background) {
		jQuery(cell).css({backgroundColor: '#' + background[1]});
	}
}
// Custom Natural Sort Function
// see https://datatables.net/plug-ins/sorting/natural
function naturalSort (a, b, html) {
	var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?%?$|^0x[0-9a-f]+$|[0-9]+)/gi,
		sre = /(^[ ]*|[ ]*$)/g,
		dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
		hre = /^0x[0-9a-f]+$/i,
		ore = /^0/,
		htmre = /(<([^>]+)>)/ig,
	// convert all to strings and trim()
		x = a.toString().replace(sre, '') || '',
		y = b.toString().replace(sre, '') || '';
	// remove html from strings if desired
	if (!html) {
		x = x.replace(htmre, '');
		y = y.replace(htmre, '');
	}
	// chunk/tokenize
	var	xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
		yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
	// numeric, hex or date detection
		xD = parseInt(x.match(hre), 10) || (xN.length !== 1 && x.match(dre) && Date.parse(x)),
		yD = parseInt(y.match(hre), 10) || xD && y.match(dre) && Date.parse(y) || null;

	// first try and sort Hex codes or Dates
	if (yD) {
		if ( xD < yD ) {
			return -1;
		}
		else if ( xD > yD )	{
			return 1;
		}
	}

	// natural sorting through split numeric strings and default strings
	for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
		// find floats not starting with '0', string or 0 if not defined (Clint Priest)

		/*supsystic*/
		//var oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc], 10) || xN[cLoc] || 0;
		//var oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc], 10) || yN[cLoc] || 0;
		var oFxNcL = parseFloat(xN[cLoc], 10) || xN[cLoc] || 0;
		var oFyNcL = parseFloat(yN[cLoc], 10) || yN[cLoc] || 0;
		/*****/

		// handle numeric vs string comparison - number < string - (Kyle Adams)
		if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
			return (isNaN(oFxNcL)) ? 1 : -1;
		}
		// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
		else if (typeof oFxNcL !== typeof oFyNcL) {
			oFxNcL += '';
			oFyNcL += '';
		}
		if (oFxNcL < oFyNcL) {
			return -1;
		}
		if (oFxNcL > oFyNcL) {
			return 1;
		}
	}
	return 0;
}
function setCellAttributes(cellArray) {
	for (var i = 0; i < cellArray.length; i++) {

		if (cellArray[i].getAttribute('data-hide')) {
			cellArray[i].style.display = 'none';
		}

		if (colspan = cellArray[i].getAttribute('data-colspan')) {
			if (colspan > 1) {
				cellArray[i].setAttribute('colspan', colspan);
			}
		}

		if (rowspan = cellArray[i].getAttribute('data-rowspan')) {
			if (rowspan > 1) {
				cellArray[i].setAttribute('rowspan', rowspan);
			}
		}
	}
}
/**
 * Integration with our PopUp plugin
 */
function _checkOnClickPopups( $table ) {
	if(typeof(_ppsBindOnElementClickPopups) !== 'undefined' && $table && $table.size()) {
		var $bindedLinks = $table.find('[href*="#ppsShowPopUp_"].ppsClickBinded');
		if($bindedLinks && $bindedLinks.size()) {
			$bindedLinks.removeClass('ppsClickBinded').unbind('click');
		}
		_ppsBindOnElementClickPopups();
	}
}
function reviewNoticeResponse() {
	jQuery(document).one('click','.supsystic-admin-notice a, .supsystic-admin-notice button',function(event) {
		var responseCode = jQuery(this).data('response-code') || 'hide';

		jQuery('.supsystic-admin-notice .notice-dismiss').trigger('click');

		window.supsystic.Tables.request({
			module: 'tables',action: 'reviewNoticeResponse'
		},{
			responseCode: responseCode
		});
	});
}

/**
 * List of common used functions
 */
function getChunksArray(arr, len) {
	var chunks = [],
		i = 0,
		n = arr.length;

	while (i < n) {
		chunks.push(arr.slice(i, i += len));
	}

	return chunks;
}
/**
 * We will not use just jQUery.inArray because it is work incorrect for objects
 * @return mixed - key that was found element or -1 if not
 */
function toeInArray(needle, haystack) {
    if(typeof(haystack) == 'object') {
        for(var k in haystack) {
            if(haystack[ k ] == needle)
                return k;
        }
    } else if(typeof(haystack) == 'array') {
        return jQuery.inArray(needle, haystack);
    }
    return -1;
}