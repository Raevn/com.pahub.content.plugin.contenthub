pahub.api["content"] = {
	getTotalDownloads: function() { return model.content.getTotalDownloads(); },
	fixVersionString: function(version) { return model.content.fixVersionString(version);},
		
	/* CONTENT */
	addContentStore: function(store_id, display_name, data) { model.content.addContentStore(store_id, data); },
	addContentItem: function(local, store_id, content_id, display_name, url, data) { return model.content.addContentItem(local, store_id, content_id, display_name, url, data); },
	removeContentItem:  function(local, content_id) { model.content.removeContentItem(local, content_id); },
	removeContentStore: function(store_id) { model.content.removeContentStore(store_id);},	
	contentStoreExists: function(store_id) { return model.content.contentStoreExists(store_id); },
	contentItemExists: function(local, content_id) { return model.content.contentItemExists(local, content_id); },
	//getContentItemDependencies
	getContentItemDependents: function(local, content_id) { return model.content.getContentItemDependents(local, content_id); },
	contentDependenciesExist: function(local, dependencies, areEnabled) { return model.content.contentDependenciesExist(local, dependencies, areEnabled); },
	contentDependentsDisabled: function(local, dependents) { return model.content.contentDependentsDisabled(local, dependents); },
	verifyContentDependencies: function() { model.content.verifyContentDependencies(); },
	refreshAllLocalContent: function() { model.content.refreshAllLocalContent();},
	refreshLocalContent: function(store_id) { model.content.refreshLocalContent(store_id);},
	refreshAllOnlineContent: function() { model.content.refreshAllOnlineContent();},
	refreshOnlineContent: function(store_id) { model.content.refreshOnlineContent(store_id);},
	getContentStores: function(local) { return model.content.getContentStores()();},
	getContentStore: function(store_id) { return model.content.getContentStore(store_id); },
	getContentItems: function(local) { return model.content.getContentItems(local)();},
	getContentItem: function(local, content_id) { return model.content.getContentItem(local, content_id); },
	getContentName: function(content_id, prefer_local) { return model.content.getContentName(content_id, prefer_local); },
	
	/* ACTIONS */
	installContentItem: function(content_id) { model.content.installContentItem(content_id); },	
	getContentEnabled: function(local, content_id) { return model.content.getContentEnabled(local, content_id); }, //deprecate
	//getContentItemEnabled: function(local, content_id) { return model.content.getContentItemEnabled(local, content_id); },
	setContentEnabled: function(content, enabled) { return model.content.setContentEnabled(content, enabled); }, //deprecate
	enableContent: function(content, enabled) { return model.content.enableContent(content); }, //deprecate
	disableContent: function(content, enabled) { return model.content.disableContent(content); }, //deprecate
	//setContentItemEnabled: function(content, enabled) { return model.content.setContentItemEnabled(local, content_id, enabled); },
	//enableContentItem: function(content, enabled) { return model.content.enableContentItem(local, content_id); },
	//disableContentItem: function(content, enabled) { return model.content.disableContentItem(local, content_id); },
	//setContentItemsEnabled: function(content, enabled) { return model.content.setContentItemsEnabled(local, content_id, enabled); },
	//enableContentItems: function(content, enabled) { return model.content.enableContentItems(local, content_id); },
	//disableContentItems: function(content, enabled) { return model.content.disableContentItems(local, content_id); },
	
	/* FILTER */
	addFilterOption: function(local, label, type, key, mode, names, values) { model.content.addFilterOption(local, label, type, key, mode, names, values); },
	removeFilterOption: function(local, label, type, key) { model.content.removeFilterOption(local, label, type, key); },
	applyFilter: function(local, type, toggle, key, value) { model.content.applyFilter(local, type, toggle, key, value)},
	removeFilter: function(local, type, key, value) { model.content.removeFilter(local, type, key, value)},
	getAppliedFilterValue: function(local, type, key) { return model.content.getAppliedFilterValue(local, type, key); },
	getAppliedFilterValueIncluded: function(local, type, key, value) { return model.content.getAppliedFilterValueIncluded(local, type, key, value); },
	getApplyFilterResultCount: function(local, type, toggle, key, value) { return model.content.getApplyFilterResultCount(local, type, toggle, key, value)},
	
	/* SORT */
	addSortMethod: function(local, name, sort_function, group_function) { model.content.addSortMethod(local, name, sort_function, group_function); },
	//removeSortMethod
	applySort: function(local, sort_method) { model.content.applySort(local, sort_method)},
	getSort: function(local) { return model.content.getSort(local)();},
	getSortAscending: function(local) { return model.content.getSortAscending(local)();},
	setSortAscending: function(local, direction) { return model.content.setSortAscending(local, direction);},
	
	/* SELECTION */
	getSelectedContent: function(local) { model.content.getSelectedContent(local)(); }
}