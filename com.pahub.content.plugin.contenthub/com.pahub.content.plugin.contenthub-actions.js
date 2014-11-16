setup_contenthub_actions = function() {
	var mc = model.content;
	
	mc.getContentEnabled = function (loca, content_id) {
		if (pahub.api.content.contentItemExists(local, content_id) == true) {
			var content = pahub.api.content.getContentItem(local, content_id);
			return content.data.enabled();
		} 
		return false;
	}
	
	//change to content_id, enabled?
	mc.setContentEnabled = function (content_item, enabled) {
		if (enabled == true) {
			return model.content.enableContent(content_item);
		} else {
			return model.content.disableContent(content_item);
		}
	}
	
	mc.enableContent = function (content_item) {
		//enable all dependencies first (recursive)
		if (content_item.data.hasOwnProperty("required") == true) {
			for (var key in content_item.data.required) {
				if (model.content.contentDependencyExists(content_item.local, key, content_item.data.required[key], false) == true) {
					var content = pahub.api.content.getContentItem(true, key);
					if (content.data.enabled() == false) {
						pahub.api.content.enableContent(content);
					}
				}
			};
		}
		if (pahub.api.content.contentDependenciesExist(content_item.local, content_item.data["required"], true) == true) {
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
			return true;
		} else {
			var store = pahub.api.content.getContentStore(content_item.store_id);
			pahub.api.log.addLogMessage("warn", "Cannot enable " + store.data.content_name + " '" + content_item.content_id + "': Required dependency not met");
			pahub.api.content.disableContent(content_item);
			return false;
		}
	}
		
	mc.installContentItem = function(content_id) {
		if (pahub.api.content.contentItemExists(false, content_id) == true) {
			var content = pahub.api.content.getContentItem(false, content_id);
			//check for dependencies
			//check no dependencies are core plugins
	
			var dependenciesOk = true;
			
			if (content.data.hasOwnProperty("required") == true) {
				dependenciesOk = pahub.api.content.contentDependenciesExist(true, content.data.required, false);
			}
			if (dependenciesOk == true) {
				if (content.data.hasOwnProperty("url") == true) {
				
					pahub.api.resource.loadResource(content.data.url, "save", {
						name: content.display_name(),
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
							if (model.isCorePlugin(content_id) == true) {
								alert("PA Hub will now restart to complete installation of a Core Plugin");
								restart();
							} else {
								pahub.api.content.refreshLocalContent(content.store_id);
							}
							//switch to local content tab?
						}
					});
				}
			} else {
				alert("Unable to install " + content.display_name() + ", required dependencies are missing");
			}
		}
	}
	
	mc.disableContent = function (content_item) {
		if(model.isCorePlugin(content_item.content_id) == false) {
			var dependents = pahub.api.content.getContentItemDependents(true, content_item.content_id);
			if (dependents != false) {
				dependents.forEach(function(item) {
					var content = pahub.api.content.getContentItem(true, item);
					pahub.api.content.disableContent(content);
				});
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
				return true;
			} else {
				var store = pahub.api.content.getContentStore(content_item.store_id);
				pahub.api.log.addLogMessage("warn", "Cannot disable " + store.data.content_name + " '" + content_item.content_id + "': Dependent items are not disabled");
				return false;
			}
		} else {
			return false;
		}
	}
}