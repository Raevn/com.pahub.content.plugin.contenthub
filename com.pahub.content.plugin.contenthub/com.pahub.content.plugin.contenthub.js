/** CORE-CONTENT **/

function load_plugin_content(data, folder) {
	pahub.api["content"] = {
		addContentStore: function(store_id, display_name, data) { model.content.addContentStore(store_id, data); },
		addContentItem: function(store_id, content_id, display_name, local_path, data) { return model.content.addContentItem(store_id, content_id, display_name, local_path, data); },
		setContentEnabled: function(content, enabled) { model.content.setContentEnabled(content, enabled); },
		enableContent: function(content, enabled) { model.content.enableContent(content); },
		disableContent: function(content, enabled) { model.content.disableContent(content); },
		getContentStore: function(store_id) { return model.content.getContentStore(store_id); },
		getContentItem: function(store_id, content_id) { return model.content.getContentItem(store_id, content_id); },
		getAppliedFilterValue: function(local, type, key) { return model.content.getAppliedFilterValue(local, type, key); },
		getAppliedFilterValueIncluded: function(local, type, key, value) { return model.content.getAppliedFilterValueIncluded(local, type, key, value); },
		addFilterOption: function(local, label, type, key, mode, names, values) { model.content.addFilterOption(local, label, type, key, mode, names, values); },
		removeFilterOption: function(local, label, type, key) { model.content.removeFilterOption(local, label, type, key); },
		applyFilter: function(local, type, key, value) { model.content.applyFilter(local, type, key, value)},
		toggleFilter: function(local, type, key, value) { model.content.toggleFilter(local, type, key, value)}, //merge with applyFilter
		removeFilter: function(local, type, key) { model.content.removeFilter(local, type, key)},
		refreshContentStore: function(store_id) { model.content.refreshContentStore(store_id);},
		refreshContentStores: function() { model.content.refreshContentStores();},
		refreshContentCatalog: function(store_id) { model.content.refreshContentCatalog(store_id);},
		getFilterList: function(local) { return model.content.getFilterList(local);},
		getFilterOptions: function(local) { return model.content.getFilterOptions(local);},
		getApplyFilterResultCount: function(local, type, key, value) { return model.content.getApplyFilterResultCount(local, type, key, value)},
		getToggleFilterResultCount: function(local, type, key, value) { return model.content.getToggleFilterResultCount(local, type, key, value)} //merge with getApplyFilterResultCount
	}
	
	ko.observableArray.fn.filtered_list = function(filters) {
		return ko.pureComputed(function() {	
			var all_items = this();
			var matching_items = [];
			for (var i = 0; i < all_items.length; i++) {
				var current = all_items[i];
				var include = true;
				if (typeof filters == "object") {
					for (var j = 0; j < filters.length; j++) {
						if (filters[j].value != null) {
							//matched = false;
							if (filters[j].type == "match") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if (ko.unwrap(current[filters[j].key]) != filters[j].value[k]) {
										//matched = true;
										include = false;
									}
								}
							}
							if (filters[j].type == "data-match") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if (ko.unwrap(current.data[filters[j].key]) != filters[j].value[k]) {
										//matched = true;
										include = false;
									}
								}
							}
							if (filters[j].type == "contains") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if(ko.unwrap(current).hasOwnProperty(filters[j].key) == true) {
										if (ko.unwrap(current[filters[j].key]).indexOf(filters[j].value[k]) == -1) {
											//matched = true;
											include = false;
										}
									} else {
										include = false;
									}
								}
							}
							if (filters[j].type == "data-contains") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if(ko.unwrap(current.data).hasOwnProperty(filters[j].key) == true) {
										if (ko.unwrap(current.data[filters[j].key]).indexOf(filters[j].value[k]) == -1) {
											//matched = true;
											include = false;
										}
									} else {
										include = false;
									}
								}
							}
							//if (matched == false) {
								//include = false;
							//}
						}
					}
				}
				if (include == true) {
					matching_items.push(current);
				}
			}
			return matching_items;
		}, this);
	}
		
	model["content"] = {
		content_stores: ko.observableArray(),
		content_items: ko.observableArray(),
		
		local_content_filters: ko.observableArray(),
		local_content_filter_options: ko.observableArray(),
		local_content_filter_view: ko.observable(true),
		
		online_content_filters: ko.observableArray(),
		online_content_filter_options: ko.observableArray(),
		online_content_filter_view: ko.observable(true),
		
		getFilterList: function(local) {
			if (local == true) {
				return model.content.local_content_filters;
			} else {
				return model.content.online_content_filters;
			}
		},
		getFilterOptions: function(local) {
			if (local == true) {
				return model.content.local_content_filter_options;
			} else {
				return model.content.online_content_filter_options;
			}
		},
		
		getAppliedFilterValue: function(local, type, key) {
			var filter_list = pahub.api.content.getFilterList(local);
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					return filter_list()[i].value;
				}
			}
			return null;
		},
		
		getApplyFilterResultCount: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
			
			model.content.applyFilter_custom(new_filter_list, type, key, value);
			
			if (local == true) {
				return model.content.content_items.filtered_list(new_filter_list())().length;
			} else {
				return model.content.online_content_items.filtered_list(new_filter_list())().length;
			}
		},
		
		getToggleFilterResultCount: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
			
			model.content.toggleFilter_custom(new_filter_list, type, key, value);
			
			if (local == true) {
				return model.content.content_items.filtered_list(new_filter_list())().length;
			} else {
				return model.content.online_content_items.filtered_list(new_filter_list())().length;
			}
		},
		
		getAppliedFilterValueIncluded: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			
			var filter = pahub.api.content.getAppliedFilterValue(local, type, key);
			
			if (filter != null) {
				return filter.indexOf(value) > -1;
			} else {
				return value == null;
			}
		},
		
		//add filter method (AND, OR) for toggle mode
		addFilterOption: function(local, label, type, key, mode, names, values) {
			options_list = pahub.api.content.getFilterOptions(local);
			//check for existing, and replace
			options_list.push({
				label: label,
				type: type,
				key: key,
				names: names,
				values: values,
				mode: mode
			});
			
			//initial filter
			pahub.api.content.applyFilter(local, type, key, null);
		},
		
		removeFilterOption: function(local, label, type, key) {
			var options_list = pahub.api.content.getFilterOptions(local);
			
			for (var i = 0; i < options_list().length; i++) {
				if (options_list()[i].key == key && options_list()[i].type == type && options_list()[i].label == label) {
					options_list.splice(i,1);
					removeFilter(local, type, key, value);
					return;
				}
			}

		
		},
		
		//makes this generic, eg "extract value into new array" function
		content_store_names: ko.computed({
			read: function() {
				var names = [];
				
				for (var i = 0; i < model.content.content_stores().length; i++) {
					names.push(model.content.content_stores()[i].data.content_name);
				}
				
				return names;
			},
			deferEvaluation: true
		}),
		
		//makes this generic, eg "extract value into new array" function
		content_store_ids: ko.computed({
			read: function() {
				var ids = [];
				
				for (var i = 0; i < model.content.content_stores().length; i++) {
					ids.push(model.content.content_stores()[i].store_id);
				}
				
				return ids;
			},
			deferEvaluation: true
		}),
		
		toggleFilter: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			model.content.toggleFilter_custom(filter_list, type, key, value);
		},
		
		toggleFilter_custom: function(filter_list, type, key, value) {
			var found = false;
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					if ($.isArray(value) == true || value == null) {
						filter_list()[i].value = value;
					} else {
						if ($.isArray(filter_list()[i].value) == true) {
							if (filter_list()[i].value.indexOf(value) == -1) {
								filter_list()[i].value.push(value);
							} else {
								filter_list()[i].value.splice(filter_list()[i].value.indexOf(value),1);
								if (filter_list()[i].value.length == 0) {
									filter_list()[i].value = null;
								}
							}
						} else {
							filter_list()[i].value = [value];
						}
					}
					found = true;
				}
			}
			if (found == false) {
				filter_list.push({key: key, type: type, value:value});
			}
			filter_list.valueHasMutated();
		},
		
		applyFilter: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			model.content.applyFilter_custom(filter_list, type, key, value)
		},
		
		applyFilter_custom: function(filter_list, type, key, value) {
			var found = false;
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					if ($.isArray(value) == true || value == null) {
						filter_list()[i].value = value;
					} else {
						if ($.isArray(filter_list()[i].value) == true) {
							if (filter_list()[i].value.indexOf(value) == -1) {
								filter_list()[i].value.push(value);
							}
						} else {
							filter_list()[i].value = [value];
						}
					}
					found = true;
				}
			}
			if (found == false) {
				filter_list.push({key: key, type: type, value:value});
			}
			filter_list.valueHasMutated();
		},
		
		
		removeFilter: function(local, type, key) {
			var filter_list = pahub.api.content.getFilterList(local);
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					filter_list.splice(i,1);
					return;
				}
			}
		},
		
		removeFilter: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					if (filter_list()[i].value.indexOf(value) == -1) {
						filter_list()[i].value.splice(filter_list()[i].value.indexOf(value),1);
					}
					return;
				}
			}
		},
		
		contentStoreExists: function(store_id) {
			return getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1;
		},
		
		contentItemExists: function(store_id, content_id) {
			return getMapItemIndex(model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", store_id)].content_items(), "content_id", content_id) > -1;
		},
		
		active_content_store_id: ko.observable(0),

		writeContentItem: function (content_item) {
			var data = $.extend({}, content_item.data);
			data.enabled = data.enabled();
			writeJSONtoFile(path.join(content_item.local_path, "/content-info.json"), data);
		},

		enableContent: function (content_item) {
			content_item.data.enabled(true);
			if (typeof window[model.content.getContentStore(content_item.store_id).data.content_enabled_func] == "function") {
				window[model.content.getContentStore(content_item.store_id).data.content_enabled_func](content_item);
			}
			var store = pahub.api.content.getContentStore(content_item.store_id);
			if (store != false && store.data.hasOwnProperty("custom_write_content_func") == true) {
				if (typeof window[store.data.custom_write_content_func] === 'function') {
					window[store.data.custom_write_content_func](content_item);
				}	
			} else {
				model.content.writeContentItem(content_item);
			}
		},
		
		disableContent: function (content_item) {
			if(model.isCorePlugin(content_item.content_id) == false) {
				content_item.data.enabled(false);

				if (typeof window[model.content.getContentStore(content_item.store_id).data.content_disabled_func] == "function") {
					window[model.content.getContentStore(content_item.store_id).data.content_disabled_func](content_item);
				}

				var store = pahub.api.content.getContentStore(content_item.store_id);
				if (store != false && store.data.hasOwnProperty("custom_write_content_func") == true) {
					if (typeof window[store.data.custom_write_content_func] === 'function') {
						window[store.data.custom_write_content_func](content_item);
					}	
				} else {
					model.content.writeContentItem(content_item);
				}
			}
		},

		//change to content_id, enabled?
		setContentEnabled: function (content_item, enabled) {
			if (enabled == true) {
				model.content.enableContent(content_item);
			} else {
				model.content.disableContent(content_item);
			}
		},
		
		getContentStore: function(store_id) {
			if (getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1) {
				return model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", store_id)];
			} else {
				return false;
			}
		},

		//store_id no longer needed
		getContentItem: function(store_id, content_id) {
			if (getMapItemIndex(model.content.getContentStore(store_id).content_items(), "content_id", content_id) > -1) {
			
				return model.content.getContentStore(store_id).content_items()[getMapItemIndex(model.content.getContentStore(store_id).content_items(), "content_id", content_id)];
			} else {
				return false;
			}
		},
		
		addContentItem: function (store_id, content_id, display_name, local_path, data) {
			if (model.content.contentStoreExists(store_id) == true) {
				if (model.content.contentItemExists(store_id, content_id) == false) {
					var store = model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", store_id)];
					var item = {
						content_id: content_id,
						display_name: display_name,
						store_id: store_id,
						store: model.content.getContentStore(store_id),
						local_path: local_path, //fixme
						local_path_safe: local_path.replace(/\\/g,'\\\\').replace(/ /g,'\\ '),
						icon: ko.observable("assets/img/content.png"),
						data: data
					}
					var icon_url = "";
					
					if (data.hasOwnProperty("icon") == false) {
						if (fs.existsSync(path.join(local_path, "icon.png")) == true) {
							item.icon(path.join(local_path, "icon.png"));
						}
					} else {
						icon_url = data["icon"];
					}
					
					if (icon_url != "" ) {
						pahub.api.resource.loadResource(icon_url, "save", {name: "Icon: " + content_id, saveas: content_id + ".png", mode: "async", success: function(resource) {
							item.icon(path.join(constant.PAHUB_CACHE_DIR, content_id + ".png"));
						}});
					}
										
					item.data.enabled = ko.observable(data.enabled);
					
					model.content.content_items.push(item);
					store.content_items.push(item);
					
					return store.content_items()[store.content_items().length-1];
				}
			}
		},
		
		refreshContentCatalog: function(store_id) {
			pahub.api.log.addLogMessage("info", "Refreshing catalog for store '" + store_id + "'");
			var store = pahub.api.content.getContentStore(store_id);
			if (store != false) {
				if (store.data.hasOwnProperty("catalog_path") == true) {
					
				}
			}
		},
		
		refreshContentStores: function() {
			pahub.api.log.addLogMessage("info", "Refreshing all local contents");
			for (var i = 0; i < model.content.content_stores().length; i++) {
				pahub.api.content.refreshContentStore(model.content.content_stores()[i].store_id);
			}
		},
		
		refreshContentStore: function(store_id) {
			//needs to clear the content store first!
			pahub.api.log.addLogMessage("info", "Refreshing local content from store '" + store_id + "'");
			var store = pahub.api.content.getContentStore(store_id);
			
			if (store != false) {
				if (store.data.hasOwnProperty("custom_content_refresh_func") == true) {
					if (typeof window[store.data.custom_content_refresh_func] === 'function') {
						window[store.data.custom_content_refresh_func](store_id);
					}				
				} else {
					if (store.data.hasOwnProperty("local_content_path") == true) {
						var folders = getSubFolders(path.join(constant.PA_DATA_DIR, store.data.local_content_path));
					
						for (var i = 0; i < folders.length; i++) {
							pahub.api.log.addLogMessage("info", "Found content: '" + folders[i] + "'");
						}
						
						for (var i = 0; i < folders.length; i++) {
							if (fs.existsSync(path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i], "/content-info.json")) == true) {
								var contentInfo = readJSONfromFile(path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i], "/content-info.json"));
								
								if (contentInfo.hasOwnProperty("store_id") == true) {
									if (contentInfo.store_id == store_id) {
										var content_item = pahub.api.content.addContentItem(store_id, contentInfo.content_id, contentInfo.display_name, path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i]), contentInfo);
										
										if (content_item.data.enabled() == true) {
											model.content.enableContent(content_item);
											
										}
									}
								} else {
									//error: no store Id
								}
							} else {
								//ignore: empty folder; not content
							}
						}
					}
				}
			}
		},
		
		addContentStore: function(store_id, data) {
			if (model.content.contentStoreExists(store_id) == false) {
				var new_store = {
					store_id: store_id,
					store: model.content.getContentStore(store_id),
					content_items: ko.observableArray(),
					catalogue_items: ko.observableArray(),
					data: data
				};
				
				model.content.content_stores.push(new_store);
				if (model.content.contentStoreExists(model.content.active_content_store_id()) == false) {
					model.content.active_content_store_id(store_id);
				}
				
				//this should wait until PAHub has finished loading.
				pahub.api.content.refreshContentStore(store_id);
				pahub.api.content.refreshContentCatalog(store_id);
				
				//find & load content
				
				if (typeof(data) === 'object') {
					if (data.hasOwnProperty("find_installed_content_func") == true) {
						if (typeof(data.find_installed_content_func) === 'function') {
							data.find_installed_content_func();
						}
					}
				}
			}
		},
		
		validateContent: function(content) {
			//call store-specific validate function
			return true
		}
	}

	pahub.api.content.addFilterOption(true, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);
	pahub.api.content.addFilterOption(false, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);
	
	pahub.api.section.addSection("section-content", "CONTENT HUB", path.join(folder, "contenthub.png"));
	pahub.api.tab.addTab("section-content", "active-downloads", "", "assets/img/test/download.png");
	pahub.api.tab.addTab("section-content", "installed-content", "LOCAL CONTENT", "");
	pahub.api.tab.addTab("section-content", "find-content", "FIND CONTENT", "");
	pahub.api.tab.addTab("section-content", "upload-content", "UPLOAD CONTENT", "");
	
	pahub.api.resource.loadResource(folder + "/active-downloads.html", "get", {name: "HTML: active-downloads", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "active-downloads", resource.data);
	}});
	
	pahub.api.resource.loadResource(folder + "/installed-content.html", "get", {name: "HTML: installed-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "installed-content", resource.data);
	}});
	
	pahub.api.resource.loadResource(folder + "/find-content.html", "get", {name: "HTML: find-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "find-content", resource.data);
	}});
}

function unload_plugin_content(data) {}