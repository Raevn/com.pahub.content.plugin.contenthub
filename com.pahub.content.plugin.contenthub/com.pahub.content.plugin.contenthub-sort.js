setup_contenthub_sort = function() {
	var mc = model.content;

	mc.local_content_sort = ko.observable("");
	mc.local_content_sort_asc = ko.observable(true);
	mc.local_content_sort_methods = ko.observableArray();
	mc.online_content_sort = ko.observable("");
	mc.online_content_sort_asc = ko.observable(true);
	mc.online_content_sort_methods = ko.observableArray();
	mc.local_content_group = ko.observable(true);
	mc.online_content_group = ko.observable(true);

	mc.getSortMethods = function(local) {
		if (local == true) {
			return model.content.local_content_sort_methods;
		} else {
			return model.content.online_content_sort_methods;
		}
	}
	
	mc.addSortMethod = function(local, name, sort_function, group_function) {
		var sort_methods = model.content.getSortMethods(local);
		var sort = model.content.getSort(local);
		sort_methods.push({
			name: name,
			method: sort_function,
			group: group_function
		});
		
		if (sort() == "") {
			pahub.api.content.applySort(local, name);
		}
	}
	
	mc.applySort = function(local, sort_method) {
		var sort_methods = model.content.getSortMethods(local);
		var sort = model.content.getSort(local);
		var content = model.content.getContentItems(local);
		if (getMapItemIndex(sort_methods(), "name", sort_method) > -1) {
			sort(sort_method);
			content.sort(sort_methods()[getMapItemIndex(sort_methods(), "name", sort_method)].method);
		}
	}
	
	mc.getSort = function(local) {
		if (local == true) {
			return model.content.local_content_sort;
		} else {
			return model.content.online_content_sort;
		}
	}
	
	mc.getContentItemGroup = function(local, content_id) {
		var content = pahub.api.content.getContentItem(local, content_id);
		var sort = model.content.getSort(local);
		var sort_methods = model.content.getSortMethods(local);
		if (getMapItemIndex(sort_methods(), "name", sort()) > -1) {
			return sort_methods()[getMapItemIndex(sort_methods(), "name", sort())].group(content);
		} else {
			return false;
		}
	}
	
	mc.getSortAscending = function(local) {
		if (local == true) {
			return model.content.local_content_sort_asc;
		} else {
			return model.content.online_content_sort_asc;
		}
	}
	
	mc.setSortAscending = function(local, direction) {
		var sort_ascending = model.content.getSortAscending(local);
		sort_ascending(direction);
		pahub.api.content.applySort(local, pahub.api.content.getSort(local));
	}
	
	var group_func_first_letter = function (content) {
		if (content.display_name().length > 0) {
			return content.display_name().charAt(0);
		} else {
			return "";
		}
	}

	var group_func_content_type = function (content) {
		var store = pahub.api.content.getContentStore(content.store_id);
		return store.data.content_name;
	}

	var group_func_last_updated = function (content) { 
		var now = new Date();
		var contentDate = new Date(content.data.date);
		if ((now - contentDate)/(1000*60*60*24) <= 7) {
			return "Updated in the last week";
		}
		if ((now - contentDate)/(1000*60*60*24) <= 30) {
			return "Updated in the last month";
		}
		if ((now - contentDate)/(1000*60*60*24) <= 365) {
			return "Updated in the last year";
		}
		if ((now - contentDate)/(1000*60*60*24) > 365) {
			return "Updated over a year ago";
		}
		return "Unknown"
	}

	var group_func_downloads = function (content) { 
		if (content.downloads() >= 10000) {
			return "10000 +";
		}
		if (content.downloads() >= 5000) {
			return "5000 - 9999";
		}
		if (content.downloads() >= 1000) {
			return "1000 - 4999";
		}
		if (content.downloads() >= 500) {
			return "500 - 999";
		}
		if (content.downloads() >= 100) {
			return "100 - 499";
		}
		if (content.downloads() > 0) {
			return "1 - 99";
		}
		return "0";
	}

	pahub.api.content.addSortMethod(true, "Name", function(left, right) {
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	}, group_func_first_letter);

	pahub.api.content.addSortMethod(false, "Name", function(left, right) {
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? -1 : 1);
		} else {
			return left.data.display_name == right.data.display_name ? 0 : (left.data.display_name < right.data.display_name ? 1 : -1);
		}
	}, group_func_first_letter);

	pahub.api.content.addSortMethod(true, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	}, function (content) { return content.data.author});

	pahub.api.content.addSortMethod(false, "Author", function(left, right) {
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? -1 : 1);
		} else {
			return left.data.author == right.data.author ? 0 : (left.data.author < right.data.author ? 1 : -1);
		}
	}, function (content) { return content.data.author});

	pahub.api.content.addSortMethod(false, "Last Updated", function(left, right) {
		var leftDate = new Date(left.data.date);
		var rightDate = new Date(right.data.date);
		if (left.data.date == undefined) {
			return pahub.api.content.getSortAscending(false) ? 1 : -1;
		}
		if (right.data.date == undefined) {
			return pahub.api.content.getSortAscending(false) ? -1 : 1;
		}
		if (pahub.api.content.getSortAscending(false) == true ) {
			return leftDate == rightDate ? 0 : (leftDate < rightDate ? -1 : 1);
		} else {
			return leftDate == rightDate ? 0 : (leftDate < rightDate ? 1 : -1);
		}
	}, group_func_last_updated);

	pahub.api.content.addSortMethod(true, "Last Updated", function(left, right) {
		var leftDate = new Date(left.data.date);
		var rightDate = new Date(right.data.date);
		if (left.data.date == undefined) {
			return pahub.api.content.getSortAscending(true) ? 1 : -1;
		}
		if (right.data.date == undefined) {
			return pahub.api.content.getSortAscending(true) ? -1 : 1;
		}
		if (pahub.api.content.getSortAscending(true) == true ) {
			return leftDate == rightDate ? 0 : (leftDate < rightDate ? 1 : -1);
		} else {
			return leftDate == rightDate ? 0 : (leftDate < rightDate ? -1 : 1);
		}
	}, group_func_last_updated);

	pahub.api.content.addSortMethod(true, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(true) == true ) {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? -1 : 1);
		} else {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? 1 : -1);
		}
	}, group_func_content_type);

	pahub.api.content.addSortMethod(false, "Content type", function(left, right) {
		var left_store_name = left.store.data.content_name;
		var right_store_name = right.store.data.content_name;
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? -1 : 1);
		} else {
			return left_store_name == right_store_name ? 0 : (left_store_name < right_store_name ? 1 : -1);
		}
	}, group_func_content_type);

	pahub.api.content.addSortMethod(false, "Downloads", function(left, right) {
		if (pahub.api.content.getSortAscending(false) == true ) {
			return left.downloads() == right.downloads() ? 0 : (left.downloads() < right.downloads() ? -1 : 1);
		} else {
			return left.downloads() == right.downloads() ? 0 : (left.downloads() < right.downloads() ? 1 : -1);
		}
	}, group_func_downloads);

	//returns a sorted array without modifying the original
	ko.observableArray.fn.sorted_list = function(sort_method) {
		return ko.pureComputed(function() {	
			var all_items = this();
			var sorted_items = $.extend([], all_items);
			
			sorted_items.sort(sort_method);
			
			return sorted_items;
		}, this);
	}
}