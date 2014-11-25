setup_contenthub_content = function() {
	var mc = model.content;

	mc.addContentStore = function(store_id, data) {
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
						
			if (typeof(data) === 'object') {
				if (data.hasOwnProperty("find_installed_content_func") == true) {
					if (typeof(data.find_installed_content_func) === 'function') {
						data.find_installed_content_func();
					}
				}
			}
		}
	}
	
	mc.addContentItem = function (local, store_id, content_id, display_name, url, data) {
		if (model.content.contentStoreExists(store_id) == true) {
			if (model.content.contentItemExists(local, content_id) == false) {
				var store = pahub.api.content.getContentStore(store_id)
				
				//call validate function
				
				var item = {
					local: local, //ko.mapping
					content_id: content_id, //ko.mapping
					display_name: ko.observable(display_name), //ko.mapping //is this needed?
					store_id: store_id, //ko.mapping
					store: model.content.getContentStore(store_id), //ko.mapping
					icon: ko.observable("assets/img/content.png"),
					url: url, //ko.mapping
					online_content: ko.observable(),
					local_content: ko.observable(),
					required_array: ko.observableArray(),
					version: ko.observable(pahub.api.content.fixVersionString(data.version)),
					downloads: ko.observable(0),
					newly_updated: ko.observable(false),
					selected: ko.observable(false), //should really be dynamic (ko.computed)
					data: data //ko.mapping
				}
				
				if (data.hasOwnProperty("date") == true) {
					var now = new Date();
					var contentDate = new Date(item.data.date);
					if ((now - contentDate)/(1000*60*60*24) <= 7) {
						item.newly_updated(true);
					}
				}
				
				if (data.hasOwnProperty("required") == true) {
					for (var key in data.required) {
						item.required_array.push({"content_id": key, "condition": data.required[key]});
					}
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
						if (item.version() != online_content.version()) {
							pahub.api.log.addLogMessage("info", "New version of " + store.data.content_name + " '" + item.content_id + "', Local:" + item.version() + ", Online: " + online_content.version());
						}
					}
				} else {
					item.online_content(item);
					store.online_content_items.push(item);
					
					if (model.content.contentItemExists(true, item.content_id) == true) {
						var local_content = model.content.getContentItem(true, item.content_id);
						item.local_content(local_content);
						local_content.online_content(item);
						if (item.version() != local_content.version()) {
							pahub.api.log.addLogMessage("info", "New version of " + store.data.content_name + " '" + item.content_id + "', Local:" + local_content.version() + ", Online: " + item.version());
						}
					}
				}
				
				model.content.getContentItems(local).push(item);
				pahub.api.content.applySort(local, pahub.api.content.getSort(local));

				return item;
			}
		}
		return false;
	}
	
	mc.removeContentStore = function(store_id) {
		var store = pahub.api.content.getContentStore(store_id)
		
		var local_content = store.local_content_items();
		var online_content = store.online_content_items();
		
		for (var i = local_content.length - 1; i >= 0; i--) {
			model.content.removeContentItem(true, local_content[i].content_id);
		}
		
		for (var i = online_content.length - 1; i >= 0; i--) {
			model.content.removeContentItem(false, online_content[i].content_id);
		}
		
		model.content.content_stores.remove(store);
	}
	
	mc.removeContentItem = function(local, content_id) {
		if (pahub.api.content.contentItemExists(local, content_id) == true) {
			pahub.api.log.addLogMessage("info", "Removing '" + content_id + "'");
			var content = pahub.api.content.getContentItem(local, content_id);
			if(model.isCorePlugin(content.content_id) == false) {
				if (local == true) {
					//don't disable
					//pahub.api.content.disableContent(content);
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
					content.store.local_content_items.remove(content);
				} else {
					content.store.online_content_items.remove(content);
				}
				//remove from content list
				content_items.remove(content);
			}
		}
	}
		
	mc.contentStoreExists = function(store_id) {
		return getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1;
	}
	
	mc.contentItemExists = function(local, content_id) {
		return getMapItemIndex(model.content.getContentItems(local)(), "content_id", content_id) > -1;
	}
	
	mc.getContentItemDependents = function(local, content_id) {
		if (pahub.api.content.contentItemExists(local, content_id) == true) {
			var dependents = []
			var content = pahub.api.content.getContentItems(local);
			content.forEach(function(item) {
				if (item.data.hasOwnProperty("required") == true) {
					if (item.data.required.hasOwnProperty(content_id) == true) {
						dependents.push(item.content_id);
					}
				}
			});
			return dependents;
		}
		return false;
	}
	
	mc.contentDependencyExists = function(local, dependency, test, isEnabled) {
		var dependencyEnabled = true;
		var dependencyExist = true;
		
		if (pahub.api.content.contentItemExists(local, dependency) == true) {
			var dependency_content = pahub.api.content.getContentItem(local, dependency);
			if (dependency_content.data.enabled() == false) {
				//content is disabled
				dependencyEnabled = false;
			}
			if (semver.satisfies(dependency_content.version(), test) == false ) {
				dependencyEnabled = false;
				dependencyExist = false;
			}				
		} else {
			//content isn't found
			dependencyEnabled = false;
			dependencyExist = false;
		}
		
		if (isEnabled == true) {
			return dependencyEnabled;
		} else {
			return dependencyExist;
		}
	}
	
	mc.contentDependenciesExist = function(local, dependencies, areEnabled) {
	
		//check content exists
		var exists = true;
		
		for (var key in dependencies) {
			//check versions
			exists = exists && model.content.contentDependencyExists(local, key, dependencies[key], areEnabled);
		}
		return exists;
	}
	
	mc.contentDependentsDisabled = function(local, dependents) {
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
	}
	
	mc.verifyContentDependencies = function() {
		var contentItems = pahub.api.content.getContentItems(true);
		for (var i = 0; i < contentItems.length; i++) {
			if (contentItems[i].data.hasOwnProperty("required") == true && pahub.api.content.contentDependenciesExist(true, contentItems[i].data.required, true) == false) {
				pahub.api.content.disableContentItem(contentItems[i].content_id);
			}
		}
	}
	
	mc.getContentStores = function() {
		return model.content.content_stores;
	}
	
	mc.getContentStore = function(store_id) {
		if (getMapItemIndex(model.content.content_stores(), "store_id", store_id) > -1) {
			return model.content.content_stores()[getMapItemIndex(model.content.content_stores(), "store_id", store_id)];
		} else {
			return false;
		}
	}

	mc.getContentItems = function(local) {
		if (local == true) {
			return model.content.local_content_items;
		} else {
			return model.content.online_content_items;
		}
	}
	
	mc.getContentItem = function(local, content_id) {
		if (pahub.api.content.contentItemExists(local, content_id) == true) {
			return model.content.getContentItems(local)()[getMapItemIndex(model.content.getContentItems(local)(), "content_id", content_id)];
		} else {
			return false;
		}
	}
	
	mc.getContentName = function(content_id, prefer_local) {
		var local_content = pahub.api.content.getContentItem(true, content_id);
		var online_content = pahub.api.content.getContentItem(false, content_id);
		
		if (local_content == false && online_content == false) {
			return "";
		}
		
		if (local_content == false) {
			return online_content.data.display_name;
		}
		
		if (online_content == false) {
			return local_content.data.display_name;
		}
		
		if (local_content && prefer_local == true) {
			return local_content.data.display_name;
		}
		
		if (online_content && prefer_local == false) {
			return online_content.data.display_name;
		}
	}
	
	mc.refreshAllLocalContent = function() {
		pahub.api.log.addLogMessage("info", "Refreshing all local contents");
		for (var i = 0; i < model.content.content_stores().length; i++) {
			pahub.api.content.refreshLocalContent(model.content.content_stores()[i].store_id);
		}
	}
	
	mc.refreshLocalContent = function(store_id) {
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
	}
	
	mc.findLocalContent = function(store_id) {
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
	}
	
	mc.loadLocalContent = function(store_id, content_queue) {
		var store = pahub.api.content.getContentStore(store_id);
		
		//load Content
		if ($.isArray(content_queue) == true) {
			var new_queue = [];
			
			content_queue.forEach(function(item) {
				if (pahub.api.content.contentItemExists(true, item.content_id) == true) {
					var content = pahub.api.content.getContentItem(true, item.content_id);
					if (content.version() != pahub.api.content.fixVersionString(item.data.version)) {
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
					if (pahub.api.content.contentDependenciesExist(true, contentInfo.data["required"], true) == true) {
						var content_item = pahub.api.content.addContentItem(true, contentInfo.store_id, contentInfo.content_id, contentInfo.data.display_name, contentInfo.url, contentInfo.data);
						if (content_item != false) {
							if (content_item.data.enabled() == true) {
								pahub.api.content.enableContentItem(content_item.content_id);
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
				var content = pahub.api.content.addContentItem(true, item.store_id, item.content_id, item.data.display_name, item.url, item.data);
				if (content != false) {
					if (content.data.enabled() == true) {
						pahub.api.content.enableContentItem(content.content_id);
					}
				}
			});
		}
	}
	
	mc.refreshAllOnlineContent = function() {
		pahub.api.log.addLogMessage("info", "Refreshing all online content");
		for (var i = 0; i < model.content.content_stores().length; i++) {
			pahub.api.content.refreshOnlineContent(model.content.content_stores()[i].store_id);
		}
	}
	
	mc.refreshOnlineContent = function(store_id) {
		var store = pahub.api.content.getContentStore(store_id);
		if (store != false) {
			if (store.data.hasOwnProperty("online_content_path") == true) {
				pahub.api.resource.loadResource(store.data.online_content_path, "save", {
					name: store.data.content_name + " catalog",
					saveas: store_id + ".catalog.json",
					mode: "async",
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
									pahub.api.log.addLogMessage("info", "Found " + catalogJSON.length + " online content items for store '" + store_id + "'");
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
	}
	
	mc.writeContentItem = function (content_item) {
		var data = $.extend({}, content_item.data);
		data.enabled = data.enabled();
		writeJSONtoFile(path.normalize(content_item.url), data);
	}
	
	mc.validateContent = function(content) {
		//call store-specific validate function
		return true
	}
	
}