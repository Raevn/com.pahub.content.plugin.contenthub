/** CORE-CONTENT **/

//TODO: Bug with content filter counts not updating when selecting additional features
//      Related to ko.deferred?

function load_plugin_content(data, folder) {
	pahub.api["content"] = {
		addContentStore: function(store_id, display_name, data) { model.content.addContentStore(store_id, data); },
		addContentItem: function(local, store_id, content_id, display_name, url, data) { return model.content.addContentItem(local, store_id, content_id, display_name, url, data); },
		//removeContentStore
		removeContentItem:  function(local, content_id) { model.content.removeContentItem(local, content_id); },

		//install, update, delete etc.
		installContentItem: function(content_id) { model.content.installContentItem(content_id); },
		
		contentStoreExists: function(store_id) { return model.content.contentStoreExists(store_id); },
		contentItemExists: function(local, content_id) { return model.content.contentItemExists(local, content_id); },
		
		//getContentItemDependencies
		getContentItemDependents: function(local, content_id) { return model.content.getContentItemDependents(local, content_id); },
		contentDependenciesExist: function(local, content, dependencies, areEnabled) { return model.content.contentDependenciesExist(local, content, dependencies, areEnabled); },
		contentDependentsDisabled: function(local, dependents) { return model.content.contentDependentsDisabled(local, dependents); },
		
		//getContentEnabled
		setContentEnabled: function(content, enabled) { model.content.setContentEnabled(content, enabled); }, //change to content_id
		enableContent: function(content, enabled) { model.content.enableContent(content); }, //change to content_id
		disableContent: function(content, enabled) { model.content.disableContent(content); }, //change to content_id
		
		getContentStores: function(local) { return model.content.getContentStores()();},
		getContentStore: function(store_id) { return model.content.getContentStore(store_id); },
		getContentItems: function(local) { return model.content.getContentItems(local)();},
		getContentItem: function(local, content_id) { return model.content.getContentItem(local, content_id); },
		
		addFilterOption: function(local, label, type, key, mode, names, values) { model.content.addFilterOption(local, label, type, key, mode, names, values); },
		removeFilterOption: function(local, label, type, key) { model.content.removeFilterOption(local, label, type, key); },
		applyFilter: function(local, type, toggle, key, value) { model.content.applyFilter(local, type, toggle, key, value)},
		removeFilter: function(local, type, key, value) { model.content.removeFilter(local, type, key, value)},
		getAppliedFilterValue: function(local, type, key) { return model.content.getAppliedFilterValue(local, type, key); },
		getAppliedFilterValueIncluded: function(local, type, key, value) { return model.content.getAppliedFilterValueIncluded(local, type, key, value); },
		getApplyFilterResultCount: function(local, type, toggle, key, value) { return model.content.getApplyFilterResultCount(local, type, toggle, key, value)},
		
		addSortMethod: function(local, name, sort_function) { model.content.addSortMethod(local, name, sort_function); },
		//removeSortMethod
		applySort: function(local, sort_method) { model.content.applySort(local, sort_method)},
		getSort: function(local) { return model.content.getSort(local)();},
		getSortAscending: function(local) { return model.content.getSortAscending(local)();},
		setSortAscending: function(local, direction) { return model.content.setSortAscending(local, direction);},
		
		refreshAllLocalContent: function() { model.content.refreshAllLocalContent();},
		refreshLocalContent: function(store_id) { model.content.refreshLocalContent(store_id);},
		refreshAllOnlineContent: function() { model.content.refreshAllOnlineContent();},
		refreshOnlineContent: function(store_id) { model.content.refreshOnlineContent(store_id);},
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
		local_content_filter_tab: ko.observable("filter"),
		local_content_filter_view: ko.observable(true),
		local_content_sort: ko.observable(""),
		local_content_sort_asc: ko.observable(true),
		local_content_sort_methods: ko.observableArray(),
		
		online_content_filters: ko.observableArray(),
		online_content_filter_options: ko.observableArray(),
		online_content_filter_tab: ko.observable("filter"),
		online_content_filter_view: ko.observable(true),
		online_content_sort: ko.observable(""),
		online_content_sort_asc: ko.observable(true),
		online_content_sort_methods: ko.observableArray(),
		
		hover_local_content: ko.observable(),
		hover_online_content: ko.observable(),
		
		showContentInformation: function(local, content_id) {
			if (content_id == null) {
				if (local == true) {
					model.content.hover_local_content(null);
					ko.cleanNode(document.getElementById("content-detail-local"));
					$("#content-detail-local").html(html);
				} else {
					model.content.hover_online_content(null);
					ko.cleanNode(document.getElementById("content-detail-online"));
					$("#content-detail-online").html("");
				}
			} else {
				if (model.content.contentItemExists(local, content_id) == true) {
					var content = pahub.api.content.getContentItem(local, content_id);
					var html = "";
					if (content.local == true) {
						model.content.hover_local_content(content);
						if (content.store.data.hasOwnProperty("custom_local_content_info_func") == true) {
							if (typeof window[content.store.data.custom_local_content_info_func] === 'function') {
								html = window[content.store.data.custom_local_content_info_func](local, content_id);
							}
						} else {
							html = 
								"<!-- ko with: model.content.hover_local_content -->" +
								"<div class='content-detail-cont' data-bind=\"css: {'content-disabled': !data.enabled(), 'content-update-available': online_content() ? data.version != online_content().data.version : false}\">" +
									"<img class='content-detail-image' alt='' title='' data-bind=\"attr : { src : $data.icon() }\"/>" +
									"<div class='content-detail-item' data-bind=\"click: function() { pahub.api.content.setContentEnabled($data, !$data.data.enabled())}\">" +
										"<div class='content-detail-checkbox'>" +
											"<input type='checkbox' data-bind='checked: data.enabled, click: function() { pahub.api.content.setContentEnabled($data, $data.data.enabled()); return true}'></input><label></label>" +
										"</div>	" +
										"<div class='content-detail-name' data-bind='text: data.display_name'></div>" +
										"<div class='content-detail-description' data-bind='text: data.description'></div>" +
										"<div class='content-detail-type'>" +
											"<div class='content-detail-type-inner' data-bind=\"style: {background: 'rgba(' + $data.store.data.content_colour[0] + ',' + $data.store.data.content_colour[1] + ',' + $data.store.data.content_colour[2] + ',1.0)'}, text: $data.store.data.content_name\"></div>" +
										"</div>" +
									"</div>" +
								"</div>" +
								"<!-- /ko -->";
						}
						
						ko.cleanNode(document.getElementById("content-detail-local"));
						$("#content-detail-local").html(html);
						ko.applyBindings(model, document.getElementById("content-detail-local"));
					} else {
						model.content.hover_online_content(content);
						if (content.store.data.hasOwnProperty("custom_online_content_info_func") == true) {
							if (typeof window[content.store.data.custom_online_content_info_func] === 'function') {
								html = window[content.store.data.custom_online_content_info_func](content_item);
							}
						} else {
							html = 
								"<!-- ko with: model.content.hover_online_content -->" +
								"<div class='content-detail-cont' data-bind=\"css: {'content-update-available': local_content() ? data.version != local_content().data.version : false}\">" +
									"<img class='content-detail-image' alt='' title='' data-bind=\"attr : { src : $data.icon() }\"/>" +
									"<div class='content-detail-item'>" +
										"<div class='content-detail-name' data-bind='text: data.display_name'></div>" +
										"<div class='content-detail-description' data-bind='text: data.description'></div>" +
										"<div class='content-detail-type'>" +
											"<div class='content-detail-type-inner' data-bind=\"style: {background: 'rgba(' + $data.store.data.content_colour[0] + ',' + $data.store.data.content_colour[1] + ',' + $data.store.data.content_colour[2] + ',1.0)'}, text: $data.store.data.content_name\"></div>" +
										"</div>" +
									"</div>" +
								"</div>" +
								"<!-- /ko -->";
						}
						ko.cleanNode(document.getElementById("content-detail-online"));
						$("#content-detail-online").html(html);
						ko.applyBindings(model, document.getElementById("content-detail-online"));
					}
				}
			}
		},
		
		addContentStore: function(store_id, data) {
			if (model.content.contentStoreExists(store_id) == false) {
				var new_store = {
					store_id: store_id, //ko.mapping
					local_content_items: ko.observableArray(),
					online_content_items: ko.observableArray(),
					data: data //ko.mapping
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
					
					//call validate function
					
					var item = {
						local: local, //ko.mapping
						content_id: content_id, //ko.mapping
						display_name: display_name, //ko.mapping
						store_id: store_id, //ko.mapping
						store: model.content.getContentStore(store_id), //ko.mapping
						icon: ko.observable("assets/img/content.png"),
						url: url, //ko.mapping
						online_content: ko.observable(),
						local_content: ko.observable(),
						data: data //ko.mapping
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
						if (fs.existsSync(path.join(constant.PAHUB_CACHE_DIR, "icons", content_id + ".png")) == true) {
							item.icon(path.join(constant.PAHUB_CACHE_DIR, "icons", content_id + ".png"));
						} else {
							pahub.api.resource.loadResource(icon_url, "save", {name: "Icon: " + content_id, saveas: "icons/" + content_id + ".png", mode: "async", success: function(resource) {
								item.icon(path.join(constant.PAHUB_CACHE_DIR, 'icons', content_id + ".png"));
							}});
						}
					}
					
					if (local == true) {
						item.local_content(item);
						item.data.enabled = ko.observable(data.enabled);
						store.local_content_items.push(item);
						
						if (model.content.contentItemExists(false, item.content_id) == true) {
							var online_content = model.content.getContentItem(false, item.content_id);
							item.online_content(online_content);
							online_content.local_content(item);
							if (item.data.version != online_content.data.version) {
								pahub.api.log.addLogMessage("info", "New version of " + store.data.content_name + " '" + item.content_id + "', Local:" + item.data.version + ", Online: " + online_content.data.version);
							}
						}
					} else {
						item.online_content(item);
						store.online_content_items.push(item);
						
						if (model.content.contentItemExists(true, item.content_id) == true) {
							var local_content = model.content.getContentItem(true, item.content_id);
							item.local_content(local_content);
							local_content.online_content(item);
							if (item.data.version != local_content.data.version) {
								pahub.api.log.addLogMessage("info", "New version of " + store.data.content_name + " '" + item.content_id + "', Local:" + local_content.data.version + ", Online: " + item.data.version);
							}
						}
					}
					
					model.content.getContentItems(local).push(item);
					pahub.api.content.applySort(local, pahub.api.content.getSort(local));

					return item;
				}
			}
			return false;
		},
		
		removeContentItem: function(local, content_id) {
			pahub.api.log.addLogMessage("info", "Removing '" + content_id + "'");
			if (pahub.api.content.contentItemExists(local, content_id) == true) {
				var content = pahub.api.content.getContentItem(local, content_id);
				if(model.isCorePlugin(content.content_id) == false) {
					if (local == true) {
						pahub.api.content.disableContent(content);
					}
					var content_items = model.content.getContentItems(local);
					
					//remove reference from opposite content
					if (pahub.api.content.contentItemExists(!local, content_id) == true) {
						var other_content = pahub.api.content.getContentItem(!local, content_id);
						if (local == true) {
							other_content.online_content(null);
						} else {
							other_content.local_content(null);
						}
					}
					
					//remove from store
					
					if (local == true) {
						content.store.local_content_items.splice(content_items().indexOf(content),1);
					} else {
						content.store.online_content_items.splice(content_items().indexOf(content),1);
					}
					
					//remove from content list
					content_items.splice(content_items().indexOf(content),1);
				}
			}
		},
		
		installContentItem: function(content_id) {
			if (pahub.api.content.contentItemExists(false, content_id) == true) {
				var content = pahub.api.content.getContentItem(false, content_id);
				if (content.data.hasOwnProperty("url") == true) {
					//check for dependencies
				
					pahub.api.resource.loadResource(content.data.url, "save", {
						name: content.display_name,
						saveas: content.content_id + ".zip",
						success: function(item) {
							pahub.api.content.removeContentItem(true, content.content_id);
							
							if (content.store.data.hasOwnProperty("custom_install_content_func") == true) {
								if (typeof window[content.store.data.custom_install_content_func] === 'function') {
									window[content.store.data.custom_install_content_func](content_id);
								}	
							} else {
								extractZip(path.join(constant.PAHUB_CACHE_DIR, content.content_id + ".zip"), 
									content.content_id, 
									path.join(constant.PA_DATA_DIR, content.store.data.local_content_path), 
									getZippedFilePath(path.join(constant.PAHUB_CACHE_DIR, content.content_id + ".zip"), "content-info.json")
								);
							}
							pahub.api.content.refreshLocalContent(content.store_id);
							//switch to local content tab?
						}
					});
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
		
		contentDependencyExists: function(local, item, isEnabled) {
			var dependencyEnabled = true;
			var dependencyExist = true;
			if (typeof item === "object") {
				if (pahub.api.content.contentItemExists(local, item["content_id"]) == true) {
					var dependency_content = pahub.api.content.getContentItem(local, item["content_id"]);
					if (dependency_content.data.enabled() == false) {
						//content is disabled
						dependencyEnabled = false;
					}
					//minimum version
					if (item.hasOwnProperty("min") == true) {
						if (semver.lt(dependency_content.data.version, item["min"]) == true) {
							dependencyEnabled = false;
							dependencyExist = false;
						}
					}
					//maximum version
					if (item.hasOwnProperty("max") == true) {
						if (semver.gt(dependency_content.data.version, item["max"]) == true) {
							dependencyEnabled = false;
							dependencyExist = false;
						}
					}
				} else {
					//content isn't found
					dependencyEnabled = false;
					dependencyExist = false;
				}
			} else {
				if (pahub.api.content.contentItemExists(local, item) == true) {
					var dependency_content = pahub.api.content.getContentItem(local, item);
					if (dependency_content.data.enabled() == false) {
						//content is disabled
						dependencyEnabled = false;
					}
				} else {
					//content isn't found
					dependencyEnabled = false;
					dependencyExist = false;
				}
			}
			if (isEnabled == true) {
				return dependencyEnabled;
			} else {
				return dependencyExist;
			}
		},
		
		//don't need "content" param?
		contentDependenciesExist: function(local, content, dependencies, areEnabled) {
		
			//check content exists
			var exists = true;
			
			if ($.isArray(dependencies) == true) {
				dependencies.forEach(function(item) {
					//check versions
					exists = exists && model.content.contentDependencyExists(local, item, areEnabled);
				});
			}
			return exists;
		},
		
		contentDependentsDisabled: function(local, dependents) {
			//check content exists
			var allDependentsDisabled = true;
			if ($.isArray(dependents) == true) {
				dependents.forEach(function(item) {
					if (pahub.api.content.contentItemExists(local, item) == true) {
						var content_item = pahub.api.content.getContentItem(local, item);
						if (content_item.data.enabled() == true) {
							//content is disabled
							allDependentsDisabled = false;
						}
					} else {
						//content isn't found - doesn't matter
						//allDependentsDisabled = true;
					}
				});
			}
			return allDependentsDisabled;
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
					if (model.content.contentDependencyExists(content_item.local, item, content_item.data["dependencies"], false) == true) {
						var content = null;
						if (typeof item === "object") {
							content = pahub.api.content.getContentItem(true, item["content_id"]);
						} else {
							content = pahub.api.content.getContentItem(true, item);
						}
						if (content.data.enabled() == false) {
							pahub.api.content.enableContent(content);
						}
					}
				});
			}
			if (pahub.api.content.contentDependenciesExist(content_item.local, content_item, content_item.data["dependencies"], true) == true) {
				pahub.api.log.addLogMessage("info", content_item.store.data.content_name + " '" + content_item.content_id + "': enabled");
				content_item.data.enabled(true);
				
				if (typeof window[content_item.store.data.content_enabled_func] == "function") {
					window[content_item.store.data.content_enabled_func](content_item);
				}
				
				//move this check into writeContentItem;
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
				pahub.api.content.disableContent(content_item);
			}
		},
		
		disableContent: function (content_item) {
			if(model.isCorePlugin(content_item.content_id) == false) {
				var dependents = pahub.api.content.getContentItemDependents(true, content_item.content_id);
				if (dependents != false) {
					dependents.forEach(function(item) {
						var content = pahub.api.content.getContentItem(true, item);
						pahub.api.content.disableContent(content);
					});
				} else {
					
				}
				if (pahub.api.content.contentDependentsDisabled(true, dependents) == true) {
					pahub.api.log.addLogMessage("info", content_item.store.data.content_name + " '" + content_item.content_id + "': disabled");
					content_item.data.enabled(false);

					if (typeof window[content_item.store.data.content_disabled_func] == "function") {
						window[content_item.store.data.content_disabled_func](content_item);
					}
					
					//move this check into writeContentItem;
					if (content_item.store.data.hasOwnProperty("custom_write_content_func") == true) {
						if (typeof window[content_item.store.data.custom_write_content_func] === 'function') {
							window[content_item.store.data.custom_write_content_func](content_item);
						}	
					} else {
						model.content.writeContentItem(content_item);
					}
				} else {
					var store = pahub.api.content.getContentStore(content_item.store_id);
					pahub.api.log.addLogMessage("warn", "Cannot disable " + store.data.content_name + " '" + content_item.content_id + "': Dependent items are not disabled");
				}
			}
		},
		
		getContentStores: function() {
			return model.content.content_stores;
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
			var options_list = model.content.getFilterOptions(local);
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
			var options_list = model.content.getFilterOptions(local);
			
			for (var i = 0; i < options_list().length; i++) {
				if (options_list()[i].key == key && options_list()[i].type == type && options_list()[i].label == label) {
					options_list.splice(i,1);
					removeFilter(local, type, key, value);
					return;
				}
			}
		},
		
		applyFilter: function(local, type, toggle, key, value) {
			var filter_list = model.content.getFilterList(local);
			model.content.applyFilter_custom(filter_list, type, toggle, key, value)
			filter_list.valueHasMutated();
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
			var filter_list = model.content.getFilterList(local);
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
			var filter_list = model.content.getFilterList(local);
			for (var i = 0; i < filter_list().length; i++) {
				if (filter_list()[i].key == key && filter_list()[i].type == type) {
					return filter_list()[i].value;
				}
			}
			return null;
		},
		
		getAppliedFilterValueIncluded: function(local, type, key, value) {
			var filter_list = model.content.getFilterList(local);
			
			var filter = pahub.api.content.getAppliedFilterValue(local, type, key);
			
			if (filter != null) {
				return filter.indexOf(value) > -1;
			} else {
				return value == null;
			}
		},
		
		getApplyFilterResultCount: function(local, type, toggle, key, value) {
			var filter_list = model.content.getFilterList(local);
			var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
			
			model.content.applyFilter_custom(new_filter_list, type, toggle, key, value);
			
			return model.content.getContentItems(local).filtered_list(new_filter_list())().length;
		},
		
		addSortMethod: function(local, name, sort_function) {
			var sort_methods = model.content.getSortMethods(local);
			var sort = model.content.getSort(local);
			sort_methods.push({
				name: name,
				method: sort_function
			});
			
			if (sort() == "") {
				pahub.api.content.applySort(local, name);
			}
		},
		
		applySort: function(local, sort_method) {
			var sort_methods = model.content.getSortMethods(local);
			var sort = model.content.getSort(local);
			var content = model.content.getContentItems(local);
			if (getMapItemIndex(sort_methods(), "name", sort_method) > -1) {
				sort(sort_method);
				content.sort(sort_methods()[getMapItemIndex(sort_methods(), "name", sort_method)].method);
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
		
		setSortAscending: function(local, direction) {
			var sort_ascending = model.content.getSortAscending(local);
			sort_ascending(direction);
			pahub.api.content.applySort(local, pahub.api.content.getSort(local));
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
						}, 1);
					} else {
						//error
					}
				} else {
					setTimeout(function(){
						content_queue = model.content.findLocalContent(store_id);
						model.content.loadLocalContent(store_id, content_queue);
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
				var new_queue = [];
				
				content_queue.forEach(function(item) {
					if (pahub.api.content.contentItemExists(true, item.content_id) == true) {
						var content = pahub.api.content.getContentItem(true, item.content_id);
						if (content.version != item.version) {
							new_queue.push(item);
						}						
					} else {
						new_queue.push(item);
					}
				});
				content_queue = new_queue;
				
				pahub.api.log.addLogMessage("info", "Found " + content_queue.length + " new content items for store '" + store_id + "'");
				
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
						if (pahub.api.content.contentDependenciesExist(true, contentInfo, contentInfo.data["dependencies"], true) == true) {
							var content_item = pahub.api.content.addContentItem(true, contentInfo.store_id, contentInfo.content_id, contentInfo.data.display_name, contentInfo.url, contentInfo.data);
							if (content_item != false) {
								if (content_item.data.enabled() == true) {
									model.content.enableContent(content_item);
								}
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
					//pahub.api.log.addLogMessage("warn", "Cannot enable " + item_store.data.content_name + ": '" + item.content_id + "': Required dependency not met");
					var content = pahub.api.content.addContentItem(true, item.store_id, item.content_id, item.data.display_name, item.url, item.data);
					if (content != false) {
						if (content.data.enabled() == true) {
							model.content.enableContent(content);
						}
					}
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
										}
									} else {
										for (var i = 0; i < catalogJSON.length; i++) {
											pahub.api.log.addLogMessage("verb", "Found online " + store.data.content_name + ": '" + catalogJSON[i].content_id + "'");
										}
										for (var i = 0; i < catalogJSON.length; i++) {
											pahub.api.content.addContentItem(false, store_id, catalogJSON[i].content_id, catalogJSON[i].display_name, null, catalogJSON[i]);
										}
									}
								}, 1);
							}
						}
					});
				}
			}
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
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Name", function(left, right) {
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Last Updated", function(left, right) {
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left.data.date == right.data.date ? 0 : (left.data.date < right.data.date ? -1 : 1);
		} else {
			return left.data.date == right.data.date ? 0 : (left.data.date < right.data.date ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(true, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? -1 : 1);
		} else {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? 1 : -1);
		}
	});
	pahub.api.content.addSortMethod(false, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(false) == true ) {
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