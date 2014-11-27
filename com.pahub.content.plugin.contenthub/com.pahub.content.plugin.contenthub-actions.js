setup_contenthub_actions = function() {
	var mc = model.content;

	//deprecated (replaced with getContentItemEnabled)
	mc.getContentEnabled = function (local, content_id) {
		return model.content.getContentItemEnabled(content_id);
	}
	
	//deprecated (replaced with setContentItemEnabled)
	mc.setContentEnabled = function (content_item, enabled) {
		return model.content.setContentItemEnabled(content_item.content_id, enabled);
	}
	
	//deprecated (replaced with enableContentItem)
	mc.enableContent = function (content_item) {
		return model.content.enableContentItem(content_item.content_id);
	}
	
	//deprecated (replaced with disableContentItem)
	mc.disableContent = function (content_item) {
		return model.content.disableContentItem(content_item.content_id);
	}
	
	
	
	mc.setSelectedContentItemsEnabled = function(enabled) {
		var selectedItems = pahub.api.content.getSelectedContent(true);
		var itemIDsList = [];
		
		for (var i = 0; i < selectedItems.length; i++) {
			itemIDsList.push(selectedItems[i].content_id);
		}
		
		pahub.api.content.setContentItemsEnabled(itemIDsList, enabled);
	}
	
	mc.installSelectedContentItems = function(local) {
		var selectedItems = pahub.api.content.getSelectedContent(local);
		var itemIDsList = [];
	
		for (var i = 0; i < selectedItems.length; i++) {
			itemIDsList.push(selectedItems[i].content_id);
		}
		
		pahub.api.content.installContentItems(itemIDsList);
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
							
							var update = pahub.api.content.contentItemExists(false, content_id);
							if (pahub.api.content.contentItemExists(true, content_id) == true) {
								pahub.api.content.disableContentItem(content.content_id, true);
								pahub.api.content.removeContentItem(true, content.content_id);
							}
							
							if (content.store.data.hasOwnProperty("custom_install_content_func") == true) {
								if (typeof window[content.store.data.custom_install_content_func] === 'function') {
									window[content.store.data.custom_install_content_func](content_id, update);
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
								pahub.api.content.verifyContentDependencies();
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

	mc.getContentItemEnabled = function (content_id) {
		if (pahub.api.content.contentItemExists(true, content_id) == true) {
			var content = pahub.api.content.getContentItem(true, content_id);
			return content.data.enabled();
		} 
		return false;
	}
	
	mc.setContentItemEnabled = function (content_id, enabled) {
		if (enabled == true) {
			return model.content.enableContentItem(content_id);
		} else {
			return model.content.disableContentItem(content_id);
		}
	}
	
	mc.enableContentItem = function (content_id) {
		if (pahub.api.content.contentItemExists(true, content_id) == true) {
			var content_item = pahub.api.content.getContentItem(true, content_id);
			//enable all dependencies first (recursive)
			if (content_item.data.hasOwnProperty("required") == true) {
				for (var key in content_item.data.required) {
					if (model.content.contentDependencyExists(true, key, content_item.data.required[key], false) == true) {
						var content = pahub.api.content.getContentItem(true, key);
						if (content.data.enabled() == false) {
							pahub.api.content.enableContentItem(content.content_id);
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
				pahub.api.content.disableContentItem(content_item.content_id);
				return false;
			}
		}
	}

	mc.disableContentItem = function (content_id, dontDisableDependencies) {
		if (pahub.api.content.contentItemExists(true, content_id) == true) {
			var content_item = pahub.api.content.getContentItem(true, content_id);
			
			if(model.isCorePlugin(content_item.content_id) == false) {
				if (dontDisableDependencies != true) {
					var dependents = pahub.api.content.getContentItemDependents(true, content_item.content_id);
					if (dependents != false) {
						dependents.forEach(function(item) {
							var content = pahub.api.content.getContentItem(true, item);
							pahub.api.content.disableContentItem(content.content_id);
						});
					}
				}
				
				if (pahub.api.content.contentDependentsDisabled(true, dependents) == true || dontDisableDependencies == true) {
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
		} else {
			pahub.api.log.addLogMessage("warn", "Cannot disable content with id '" + content_id + "': Content item does not exist");
		}
	}

	mc.installContentItems = function(content_ids) {
		//TODO: Check for core plugin and install first.
		if ($.isArray(content_ids) == true) {
			for (var i = 0; i < content_ids.length; i++) {
				pahub.api.content.installContentItem(content_ids[i]);
			}
		}
	}
	
	mc.setContentItemsEnabled = function (content_ids, enabled) {
		if ($.isArray(content_ids) == true) {
			for (var i = 0; i < content_ids.length; i++) {
				if (pahub.api.content.contentItemExists(true, content_ids[i]) == true) {
					pahub.api.content.setContentItemEnabled(content_ids[i], enabled);
				}
			}
		}
	}

	mc.enableContentItems = function (content_ids) {
		if ($.isArray(content_ids) == true) {
			for (var i = 0; i < content_ids.length; i++) {
				if (pahub.api.content.contentItemExists(true, content_ids[i]) == true) {
					return pahub.api.content.enableContentItem(content_ids[i]);
				}
			}
		}
	}

	mc.disableContentItems = function (content_ids) {
		if ($.isArray(content_ids) == true) {
			for (var i = 0; i < content_ids.length; i++) {
				if (pahub.api.content.contentItemExists(true, content_ids[i]) == true) {
					return pahub.api.content.disableContentItem(content_ids[i]);
				}
			}
		}
	}
}