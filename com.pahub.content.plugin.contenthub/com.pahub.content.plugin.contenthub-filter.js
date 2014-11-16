setup_contenthub_filter = function() {
	var mc = model.content;

	mc.local_content_filters = ko.observableArray();
	mc.local_content_filter_options = ko.observableArray();
	mc.local_content_filter_tab = ko.observable("filter");
	mc.local_content_filter_view = ko.observable(true);
	mc.online_content_filters = ko.observableArray();
	mc.online_content_filter_options = ko.observableArray();
	mc.online_content_filter_tab = ko.observable("filter");
	mc.online_content_filter_view = ko.observable(true);

	//returns a filtered array without modifying the original
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
									if (ko.unwrap(current[filters[j].key]).toLowerCase() != filters[j].value[k].toLowerCase()) {
										//matched = true;
										include = false;
									}
								}
							}
							if (filters[j].type == "data-match") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if (ko.unwrap(current.data[filters[j].key]).toLowerCase() != filters[j].value[k].toLowerCase()) {
										//matched = true;
										include = false;
									}
								}
							}
							//TODO: These need to not be case sensitive
							if (filters[j].type == "contains") {
								for (var k = 0; k < filters[j].value.length; k++) {
									if(ko.unwrap(current).hasOwnProperty(filters[j].key) == true) {
										var matches = 0;
										$.each(ko.unwrap(current[filters[j].key]), function(index, value) {
											if (value.toLowerCase() == filters[j].value[k].toLowerCase()) {
												matches++;
											}
										});					
										if (matches == 0) {
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
										var matches = 0;
										$.each(ko.unwrap(current.data[filters[j].key]), function(index, value) {
											if (value.toLowerCase() == filters[j].value[k].toLowerCase()) {
												matches++;
											}
										});
										if (matches == 0) {
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
	
	//add filter method (AND, OR) for toggle mode
	mc.addFilterOption = function(local, label, type, key, mode, names, values) {
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
	}
	
	mc.removeFilterOption = function(local, label, type, key) {
		var options_list = model.content.getFilterOptions(local);
		
		for (var i = 0; i < options_list().length; i++) {
			if (options_list()[i].key == key && options_list()[i].type == type && options_list()[i].label == label) {
				options_list.splice(i,1);
				pahub.api.content.removeFilter(local, type, key, value);
				return;
			}
		}
	}
	
	mc.applyFilter = function(local, type, toggle, key, value) {
		var filter_list = model.content.getFilterList(local);
		model.content.applyFilter_custom(filter_list, type, toggle, key, value)
		filter_list.valueHasMutated();
	}
	
	mc.applyFilter_custom = function(filter_list, type, toggle, key, value) {
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
	}
	
	mc.removeFilter = function(local, type, key, value) {
		var filter_list = model.content.getFilterList(local);
		for (var i = 0; i < filter_list().length; i++) {
			if (filter_list()[i].key == key && filter_list()[i].type == type) {
				if (filter_list()[i].value != null) {
					if (filter_list()[i].value.indexOf(value) > -1) {
						filter_list()[i].value.splice(filter_list()[i].value.indexOf(value),1);
					}
				}
				return;
			}
		}
	}
	
	mc.getAppliedFilterValue = function(local, type, key) {
		var filter_list = model.content.getFilterList(local);
		for (var i = 0; i < filter_list().length; i++) {
			if (filter_list()[i].key == key && filter_list()[i].type == type) {
				return filter_list()[i].value;
			}
		}
		return null;
	}
	
	mc.getAppliedFilterValueIncluded = function(local, type, key, value) {
		var filter_list = model.content.getFilterList(local);
		
		var filter = pahub.api.content.getAppliedFilterValue(local, type, key);
		
		if (filter != null) {
			return filter.indexOf(value) > -1;
		} else {
			return value == null;
		}
	}
	
	mc.getApplyFilterResultCount = function(local, type, toggle, key, value) {
		var filter_list = model.content.getFilterList(local);
		var new_filter_list = ko.observableArray(JSON.parse(JSON.stringify(filter_list())));
		
		model.content.applyFilter_custom(new_filter_list, type, toggle, key, value);
		
		return model.content.getContentItems(local).filtered_list(new_filter_list())().length;
	}
	
	mc.getFilterList = function(local) {
		if (local == true) {
			return model.content.local_content_filters;
		} else {
			return model.content.online_content_filters;
		}
	}
	
	mc.getFilterOptions = function(local) {
		if (local == true) {
			return model.content.local_content_filter_options;
		} else {
			return model.content.online_content_filter_options;
		}
	}

	pahub.api.content.addFilterOption(true, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);
	pahub.api.content.addFilterOption(false, "Content Type", "match", "store_id", "set", model.content.content_store_names, model.content.content_store_ids);

}