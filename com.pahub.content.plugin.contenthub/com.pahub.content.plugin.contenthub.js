/** CORE-CONTENT **/

function load_plugin_content(data, folder) {
	pahub.api["content"] = {
		addContentStore: function(store_id, display_name, data) { model.content.addContentStore(store_id, data); },
		addContentItem: function(local, store_id, content_id, display_name, url, data) { return model.content.addContentItem(local, store_id, content_id, display_name, url, data); },
		//removeContentStore
		//removeContentItem
		
		//contentStoreExists //this exists
		contentItemExists: function(local, content_id) { return model.content.contentItemExists(local, content_id); },
		
		//getContentItemDependencies
		getContentItemDependents: function(local, content_id) { return model.content.getContentItemDependents(local, content_id); },
		contentDependenciesEnabled: function(local,dependencies) { return model.content.contentDependenciesEnabled(local,dependencies); },
		
		//getContentEnabled
		setContentEnabled: function(content, enabled) { model.content.setContentEnabled(content, enabled); }, //change to content_id
		enableContent: function(content, enabled) { model.content.enableContent(content); }, //change to content_id
		disableContent: function(content, enabled) { model.content.disableContent(content); }, //change to content_id
		
		//getContentStores
		getContentStore: function(store_id) { return model.content.getContentStore(store_id); },
		getContentItems: function(local) { return model.content.getContentItems(local)();},
		getContentItem: function(local, content_id) { return model.content.getContentItem(local, content_id); },
		

		
		addFilterOption: function(local, label, type, key, mode, names, values) { model.content.addFilterOption(local, label, type, key, mode, names, values); },
		removeFilterOption: function(local, label, type, key) { model.content.removeFilterOption(local, label, type, key); },
		applyFilter: function(local, type, toggle, key, value) { model.content.applyFilter(local, type, toggle, key, value)},
		removeFilter: function(local, type, key, value) { model.content.removeFilter(local, type, key, value)},

		getAppliedFilterValue: function(local, type, key) { return model.content.getAppliedFilterValue(local, type, key); },
		getAppliedFilterValueIncluded: function(local, type, key, value) { return model.content.getAppliedFilterValueIncluded(local, type, key, value); },

		getApplyFilterResultCount: function(local, type, key, value) { return model.content.getApplyFilterResultCount(local, type, key, value)},
		getToggleFilterResultCount: function(local, type, key, value) { return model.content.getToggleFilterResultCount(local, type, key, value)}, //merge with getApplyFilterResultCount

		
		addSortMethod: function(local, name, sort_function) { model.content.addSortMethod(local, name, sort_function); },
		//removeSortMethod
		applySort: function(local, sort_method) { model.content.applySort(local, sort_method)},
		//getSortAscending
		setSortAscending: function(local, direction) { return model.content.setSortAscending(local, direction);},
		
		refreshAllLocalContent: function() { model.content.refreshAllLocalContent();},
		refreshLocalContent: function(store_id) { model.content.refreshLocalContent(store_id);},
		//refreshAllOnlineContent //exists
		refreshOnlineContent: function(store_id) { model.content.refreshOnlineContent(store_id);},
		
		//check these
		getFilterList: function(local) { return model.content.getFilterList(local);}, //
		getFilterOptions: function(local) { return model.content.getFilterOptions(local);}, //
		getSort: function(local) { return model.content.getSort(local);}, //
		getSortAscending: function(local) { return model.content.getSortAscending(local);}, //
		getSortMethods: function(local) { return model.content.getSortMethods(local);} //
		
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
		local_content_items: ko.observableArray(),
		online_content_items: ko.observableArray(),
		
		local_content_filters: ko.observableArray(),
		local_content_filter_options: ko.observableArray(),
		local_content_filter_view: ko.observable(true),
		local_content_sort: ko.observable(""),
		local_content_sort_asc: ko.observable(true),
		local_content_sort_methods: ko.observableArray(),
		
		online_content_filters: ko.observableArray(),
		online_content_filter_options: ko.observableArray(),
		online_content_filter_view: ko.observable(true),
		online_content_sort: ko.observable(""),
		online_content_sort_asc: ko.observable(true),
		online_content_sort_methods: ko.observableArray(),
		
		addContentStore: function(store_id, data) {
			if (model.content.contentStoreExists(store_id) == false) {
				var new_store = {
					store_id: store_id,
					local_content_items: ko.observableArray(),
					online_content_items: ko.observableArray(),
					data: data
				};
				model.content.content_stores.push(new_store);
				
				//this should wait until PAHub has finished loading.
				pahub.api.content.refreshLocalContent(store_id);
				pahub.api.content.refreshOnlineContent(store_id);
				
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
		
		addContentItem: function (local, store_id, content_id, display_name, url, data) {
			if (model.content.contentStoreExists(store_id) == true) {
				if (model.content.contentItemExists(local, content_id) == false) {
					var store = pahub.api.content.getContentStore(store_id)
					var item = {
						local: local,
						content_id: content_id,
						display_name: display_name,
						store_id: store_id,
						store: model.content.getContentStore(store_id),
						icon: ko.observable("assets/img/content.png"),
						url: url,
						online_content: null,
						local_content: null,
						data: data
					}
					var icon_url = "";
					if (data.hasOwnProperty("icon") == false) {
						if (local == true) {
							if (fs.existsSync(path.join(path.dirname(url), "icon.png")) == true) {
								icon_url = path.join(path.dirname(url), "icon.png");
							}
						}
					} else {
						icon_url = data["icon"];
					}
					
					if (icon_url != "" ) {
						if (fs.existsSync(path.join(constant.PAHUB_CACHE_DIR, content_id + ".png")) == true) {
							item.icon(path.join(constant.PAHUB_CACHE_DIR, content_id + ".png"));
						} else {
							pahub.api.resource.loadResource(icon_url, "save", {name: "Icon: " + content_id, saveas: content_id + ".png", mode: "async", success: function(resource) {
								item.icon(path.join(constant.PAHUB_CACHE_DIR, content_id + ".png"));
							}});
						}
					}
						
					if (local == true) {
						item.local_content = item;
						item.data.enabled = ko.observable(data.enabled);
						store.local_content_items.push(item);
					} else {
						item.online_content = item;
						if (data.hasOwnProperty("icon") == true) {
							item.icon(data.icon);
						}
						store.online_content_items.push(item);
					}
					model.content.getContentItems(local).push(item);
					pahub.api.content.applySort(local, pahub.api.content.getSort(local)());

					return item;
				}
			}
		},
		
		contentStoreExists: function(store_id) {
			return getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1;
		},
		
		contentItemExists: function(local, content_id) {
			return getMapItemIndex(model.content.getContentItems(local)(), "content_id", content_id) > -1;
		},
		
		getContentItemDependents: function(local, content_id) {
			if (pahub.api.content.contentItemExists(local, content_id) == true) {
				var dependents = []
				var content = pahub.api.content.getContentItems(local);
				content.forEach(function(item) {
					if (item.data.hasOwnProperty("dependencies") == true) {
						if (item.data.dependencies.indexOf(content_id) > -1) {
							dependents.push(item.content_id);
						}
					}
				});
				return dependents;
			}
			return false;
		},
		
		contentDependenciesEnabled: function(local, dependencies) {
			//check content exists
			var allDependenciesEnabled = true;
			if ($.isArray(dependencies) == true) {
				dependencies.forEach(function(item) {
					if (pahub.api.content.contentItemExists(local, item) == true) {
						var content_item = pahub.api.content.getContentItem(local, item);
						if (content_item.data.enabled() == false) {
							//content is disabled
							allDependenciesEnabled = false;
						}
					} else {
						//content isn't found
						allDependenciesEnabled = false;
					}
				});
			}
			return allDependenciesEnabled;
		},
		
		//change to content_id, enabled?
		setContentEnabled: function (content_item, enabled) {
			if (enabled == true) {
				model.content.enableContent(content_item);
			} else {
				model.content.disableContent(content_item);
			}
		},
		
		enableContent: function (content_item) {
			//enable all dependencies first (recursive)
			if (content_item.data.hasOwnProperty("dependencies") == true) {
				content_item.data.dependencies.forEach(function(item) {
					if (pahub.api.content.contentItemExists(true, item) == true) {
						var content = pahub.api.content.getContentItem(true, item);
						if (content.data.enabled() == false) {
							pahub.api.content.enableContent(content);
						}
					}
				});
			}
			if (pahub.api.content.contentDependenciesEnabled(content_item.local, content_item.data["dependencies"]) == true) {
				content_item.data.enabled(true);
				pahub.api.log.addLogMessage("info", content_item.store.data.content_name + " '" + content_item.content_id + "': enabled");
				
				if (typeof window[content_item.store.data.content_enabled_func] == "function") {
					window[content_item.store.data.content_enabled_func](content_item);
				}
				if (content_item.store.data.hasOwnProperty("custom_write_content_func") == true) {
					if (typeof window[content_item.store.data.custom_write_content_func] === 'function') {
						window[content_item.store.data.custom_write_content_func](content_item);
					}	
				} else {
					model.content.writeContentItem(content_item);
				}
			} else {
				var store = pahub.api.content.getContentStore(content_item.store_id);
				pahub.api.log.addLogMessage("warn", "Cannot enable " + store.data.content_name + " '" + content_item.content_id + "': Required dependency not met");
			}
		},
		
		disableContent: function (content_item) {
			//TODO: disable dependent content
			if(model.isCorePlugin(content_item.content_id) == false) {
				var dependents = pahub.api.content.getContentItemDependents(true, content_item.content_id);
				dependents.forEach(function(item) {
					var content = pahub.api.content.getContentItem(true, item);
					pahub.api.content.disableContent(content);
				});
			
				content_item.data.enabled(false);
				pahub.api.log.addLogMessage("info", content_item.store.data.content_name + " '" + content_item.content_id + "': disabled");

				if (typeof window[content_item.store.data.content_disabled_func] == "function") {
					window[content_item.store.data.content_disabled_func](content_item);
				}
				if (content_item.store.data.hasOwnProperty("custom_write_content_func") == true) {
					if (typeof window[content_item.store.data.custom_write_content_func] === 'function') {
						window[content_item.store.data.custom_write_content_func](content_item);
					}	
				} else {
					model.content.writeContentItem(content_item);
				}
			}
		},
		
		getContentStore: function(store_id) {
			if (getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1) {
				return model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", store_id)];
			} else {
				return false;
			}
		},

		getContentItems: function(local) {
			if (local == true) {
				return model.content.local_content_items;
			} else {
				return model.content.online_content_items;
			}
		},
		
		getContentItem: function(local, content_id) {
			if (pahub.api.content.contentItemExists(local, content_id) == true) {
				return model.content.getContentItems(local)()[getMapItemIndex(model.content.getContentItems(local)(), "content_id", content_id)];
			} else {
				return false;
			}
		},
		
		//add filter method (AND, OR) for toggle mode
		addFilterOption: function(local, label, type, key, mode, names, values) {
			var options_list = pahub.api.content.getFilterOptions(local);
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
			pahub.api.content.applyFilter(local, type, false, key, null);
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
		
		applyFilter: function(local, type, toggle, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			model.content.applyFilter_custom(filter_list, type, toggle, key, value)
		},
		
		applyFilter_custom: function(filter_list, type, toggle, key, value) {
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
								if (toggle == true) {
									filter_list()[i].value.splice(filter_list()[i].value.indexOf(value),1);
									if (filter_list()[i].value.length == 0) {
										filter_list()[i].value = null;
									}
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
		
		removeFilter: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					if (filter_list()[i].value.indexOf(value) > -1) {
						filter_list()[i].value.splice(filter_list()[i].value.indexOf(value),1);
					}
					return;
				}
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
		
		getAppliedFilterValueIncluded: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			
			var filter = pahub.api.content.getAppliedFilterValue(local, type, key);
			
			if (filter != null) {
				return filter.indexOf(value) > -1;
			} else {
				return value == null;
			}
		},
		
		getApplyFilterResultCount: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
			
			model.content.applyFilter_custom(new_filter_list, type, false, key, value);
			
			return model.content.getContentItems(local).filtered_list(new_filter_list())().length;
		},
		
		getToggleFilterResultCount: function(local, type, key, value) {
			var filter_list = pahub.api.content.getFilterList(local);
			var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
			
			model.content.applyFilter_custom(new_filter_list, type, true, key, value);
			
			return model.content.getContentItems(local).filtered_list(new_filter_list())().length;
		},
		
		addSortMethod: function(local, name, sort_function) {
			var sort_methods = pahub.api.content.getSortMethods(local);
			var sort = pahub.api.content.getSort(local);
			sort_methods.push({
				name: name,
				method: sort_function
			});
			
			if (sort() == "") {
				pahub.api.content.applySort(local, name);
			}
		},
		
		applySort: function(local, sort_method) {
			var sort_methods = pahub.api.content.getSortMethods(local);
			var sort = pahub.api.content.getSort(local);
			var content = model.content.getContentItems(local);
			if (getMapItemIndex(sort_methods(), "name", sort_method) > -1) {
				sort(sort_method);
				content.sort(sort_methods()[getMapItemIndex(sort_methods(), "name", sort_method)].method);
			}
		},
		
		setSortAscending: function(local, direction) {
			var sort_ascending = pahub.api.content.getSortAscending(local);
			sort_ascending(direction);
			pahub.api.content.applySort(local, pahub.api.content.getSort(local)());
		},
		
		refreshAllLocalContent: function() {
			pahub.api.log.addLogMessage("info", "Refreshing all local contents");
			for (var i = 0; i < model.content.content_stores().length; i++) {
				pahub.api.content.refreshLocalContent(model.content.content_stores()[i].store_id);
			}
		},
		
		refreshLocalContent: function(store_id) {
			pahub.api.log.addLogMessage("info", "Refreshing local content for store '" + store_id + "'");
			var store = pahub.api.content.getContentStore(store_id);
			
			if (store != false) {
				//find Content
				var content_queue = [];
				
				if (store.data.hasOwnProperty("find_local_content_func") == true) {
					if (typeof window[store.data.find_local_content_func] === 'function') {
						// return array of objects:
						// each object -
						//  content_id
						//  store_id
						//  url
						//  data
						setTimeout(function(){
							content_queue = window[store.data.find_local_content_func](store_id);
							model.content.loadLocalContent(store_id, content_queue);
							model.content.compareContent(store_id); //change to api
						}, 1);
					} else {
						//error
					}
				} else {
					setTimeout(function(){
						content_queue = model.content.findLocalContent(store_id);
						model.content.loadLocalContent(store_id, content_queue);
						model.content.compareContent(store_id); //change to api
					}, 1);
				}
			}
		},
		
		findLocalContent: function(store_id) {
			var store = pahub.api.content.getContentStore(store_id);
			var content_queue = [];
			if (store.data.hasOwnProperty("local_content_path") == true) {
				var folders = getSubFolders(path.join(constant.PA_DATA_DIR, store.data.local_content_path));
				for (var i = 0; i < folders.length; i++) {
					if (fs.existsSync(path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i], "content-info.json")) == true) {
						var contentInfo = readJSONfromFile(path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i], "content-info.json"));
						
						if (contentInfo.hasOwnProperty("store_id") == true) {
							if (contentInfo.store_id == store_id) {
								content_queue.push({
									content_id: contentInfo.content_id,
									store_id: store_id,
									url: path.join(constant.PA_DATA_DIR, store.data.local_content_path, folders[i], "content-info.json"),
									data: contentInfo
								});
							}
						}
					}
				}
			}
			return content_queue;
		},
		
		loadLocalContent: function(store_id, content_queue) {
			var store = pahub.api.content.getContentStore(store_id);
			
			//load Content
			if ($.isArray(content_queue) == true) {
				pahub.api.log.addLogMessage("info", "Found " + content_queue.length + " content items for store '" + store_id + "'");
				
				content_queue.forEach(function(item) {
					pahub.api.log.addLogMessage("verb", "Found local " + store.data.content_name + ": '" + item.content_id + "'");
				});
			
				//Sort content while loading
				var hasChanged = false;
				var content_queue2 = [];
				do {
					if (content_queue.length > 0) {
						var contentInfo = content_queue.shift();
						
						//Check dependencies
						if (pahub.api.content.contentDependenciesEnabled(true, contentInfo.data["dependencies"]) == true) {
							var content_item = pahub.api.content.addContentItem(true, contentInfo.store_id, contentInfo.content_id, contentInfo.data.display_name, contentInfo.url, contentInfo.data);
							
							if (content_item.data.enabled() == true) {
								model.content.enableContent(content_item);
							}
							hasChanged = true;
						} else {
							content_queue2.push(contentInfo);
						}
					}
					if (content_queue.length == 0  && hasChanged == true) {
						hasChanged = false;
						content_queue2.forEach(function(item) {
							content_queue.push(item);
						});
						content_queue2 = [];
					}
				} while (content_queue.length > 0);
				
				//dependencies for these do not exist
				content_queue2.forEach(function(item) {
					var item_store = pahub.api.content.getContentStore(item.store_id);
					pahub.api.log.addLogMessage("warn", "Cannot enable " + item_store.data.content_name + ": '" + item.content_id + "': Required dependency not met");
					item.data.enabled = false;
					pahub.api.content.addContentItem(true, item.store_id, item.content_id, item.data.display_name, item.url, item.data);
				});
			}
		},
		
		refreshAllOnlineContent: function() {
			pahub.api.log.addLogMessage("info", "Refreshing all online content");
			for (var i = 0; i < model.content.content_stores().length; i++) {
				pahub.api.content.refreshOnlineContent(model.content.content_stores()[i].store_id);
			}
		},
		
		refreshOnlineContent: function(store_id) {
			var store = pahub.api.content.getContentStore(store_id);
			if (store != false) {
				if (store.data.hasOwnProperty("online_content_path") == true) {
					pahub.api.resource.loadResource(store.data.online_content_path, "save", {
						name: store.data.content_name + " catalog",
						saveas: store_id + ".catalog.json",
						success: function() {
							pahub.api.log.addLogMessage("info", "Refreshing online content for store '" + store_id + "'");
							var catalogJSON = readJSONfromFile(path.join(constant.PAHUB_CACHE_DIR, store_id + ".catalog.json"));
							if (catalogJSON != false) {
								setTimeout(function() {
									if (store.data.hasOwnProperty("find_online_content_func") == true) {
										if (typeof window[store.data.find_online_content_func] === 'function') {
											window[store.data.find_online_content_func](store_id, catalogJSON);
											model.content.compareContent(store_id); //change to api // temp
										}
									} else {
										for (var i = 0; i < catalogJSON.length; i++) {
											pahub.api.log.addLogMessage("verb", "Found online " + store.data.content_name + ": '" + catalogJSON[i].content_id + "'");
										}
										for (var i = 0; i < catalogJSON.length; i++) {
											pahub.api.content.addContentItem(false, store_id, catalogJSON[i].content_id, catalogJSON[i].display_name, null, catalogJSON[i]);
										}
									}
									model.content.compareContent(store_id); //change to api
								}, 1);
							}
						}
					});
				}
			}
		},
		
		compareContent: function(store_id) {
			var store = pahub.api.content.getContentStore(store_id);
			store.local_content_items().forEach(function(item) {
				if (model.content.contentItemExists(false, item.content_id) == true) {
					var online_content = model.content.getContentItem(false, item.content_id);
					item.online_content = online_content;
					online_content.local_content = item;
					if (item.data.version != online_content.data.version) {
						pahub.api.log.addLogMessage("info", "New version of " + store.data.content_name + " '" + item.content_id + "', Local:" + item.data.version + ", Online: " + online_content.data.version);
					}
				}
			});
		},
		
		writeContentItem: function (content_item) {
			var data = $.extend({}, content_item.data);
			data.enabled = data.enabled();
			writeJSONtoFile(path.normalize(content_item.url), data);
		},
		
		validateContent: function(content) {
			//call store-specific validate function
			return true
		},
		
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
		getSortMethods: function(local) {
			if (local == true) {
				return model.content.local_content_sort_methods;
			} else {
				return model.content.online_content_sort_methods;
			}
		},
		getSort: function(local) {
			if (local == true) {
				return model.content.local_content_sort;
			} else {
				return model.content.online_content_sort;
			}
		},
		getSortAscending: function(local) {
			if (local == true) {
				return model.content.local_content_sort_asc;
			} else {
				return model.content.online_content_sort_asc;
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
		})
	}

	pahub.api.content.addFilterOption(true, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);
	pahub.api.content.addFilterOption(false, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);
	
	pahub.api.content.addSortMethod(true, "Name", function(left, right) {
		if (pahub.api.content.getSortAscending(true)() == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Name", function(left, right) {
		if (pahub.api.content.getSortAscending(false)() == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(true)() == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(false)() == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Last Updated", function(left, right) {
		if (pahub.api.content.getSortAscending(true)() == true ) {
			return left.data.date == right.data.date ? 0 : (left.data.date < right.data.date ? -1 : 1);
		} else {
			return left.data.date == right.data.date ? 0 : (left.data.date < right.data.date ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(true)() == true ) {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? -1 : 1);
		} else {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(false)() == true ) {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? -1 : 1);
		} else {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? 1 : -1);
		}
	});
	
	pahub.api.section.addSection("section-content", "CONTENT HUB", path.join(folder, "contenthub.png"), "sections", 20);
	pahub.api.tab.addTab("section-content", "active-downloads", "", "assets/img/test/download.png", 10);
	pahub.api.tab.addTab("section-content", "installed-content", "LOCAL CONTENT", "", 20);
	pahub.api.tab.addTab("section-content", "find-content", "FIND CONTENT", "", 30);
	pahub.api.tab.addTab("section-content", "upload-content", "UPLOAD CONTENT", "", 40);
	
	pahub.api.resource.loadResource(path.join(folder, "active-downloads.html"), "get", {name: "HTML: active-downloads", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "active-downloads", resource.data);
	}});
	
	pahub.api.resource.loadResource(path.join(folder, "installed-content.html"), "get", {name: "HTML: installed-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "installed-content", resource.data);
	}});
	
	pahub.api.resource.loadResource(path.join(folder, "find-content.html"), "get", {name: "HTML: find-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "find-content", resource.data);
	}});
}

function unload_plugin_content(data) {}