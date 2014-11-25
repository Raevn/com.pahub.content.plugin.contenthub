setup_contenthub_selection = function () {
	var mc = model.content;

	mc.selected_local_content_data = ko.observable();
	mc.selected_online_content_data = ko.observable();
	mc.selected_local_content = ko.observableArray();
	mc.selected_online_content = ko.observableArray();

	mc.selectNone = function(local) {
		model.content.setSelection(local, []);
	},
	
	mc.selectAll = function(local) {
		var content_items = model.content.getContentItems(local).filtered_list(model.content.online_content_filters())();
		var content_ids = [];
		for (var i = 0; i < content_items.length; i++) {
			content_ids.push(content_items[i].content_id);
		}
		model.content.setSelection(local, content_ids);
	},
	
	mc.getSelectedContent = function(local) {
		if (local == true) {
			return model.content.selected_local_content;
		} else {
			return model.content.selected_online_content;
		}
	}
				
	mc.setSelection = function(local, content_ids) {
		var content_items = pahub.api.content.getContentItems(local);
		var selected_items = model.content.getSelectedContent(local);
		
		selected_items.removeAll();
		
		for(var i = 0; i < content_items.length; i++) {
			content_items[i].selected(false);
		}
		
		for(var i = 0; i < content_ids.length; i++) {
			var content = pahub.api.content.getContentItem(local, content_ids[i]);
			
			if (content_items.indexOf(content) > -1) {
				content.selected(true);
				selected_items.push(content);
			} else {
				content.selected(false);
			}
		}
		model.content.showContentInformation(local);
	}

	mc.updateSelection = function(local, content_id) {
		var selected_items = model.content.getSelectedContent(local);
		
		var content = pahub.api.content.getContentItem(local, content_id);
		if (content.selected() == false) {
			selected_items.push(content);
			content.selected(true);
		} else {
			selected_items.remove(content);
			content.selected(false);
		}
		
		model.content.showContentInformation(local);
	}

	mc.getSelectedContentStructure = function(local) {
		return ko.computed({
			read: function() {
				var selectedContent = model.content.getSelectedContent(local)();
				
				var total_downloads = 0;
				for (var i = 0; i < selectedContent.length; i++) {
					total_downloads += selectedContent[i].downloads();
				}
				
				if (selectedContent.length == 1) {
					return selectedContent[0];
				} else {
					return {
						local: local,
						content_id: null,
						display_name: ko.observable(selectedContent.length + " items selected"),
						store_id: null,
						store: null,
						icon: ko.observable("assets/img/content.png"),
						url: true, //TODO: Check at least 1 does
						online_content: ko.observable(true), //TODO: Check at least 1 does
						local_content: ko.observable(), //TODO: Check at least 1 does
						required_array: ko.observableArray(),
						version: ko.observable(""),
						downloads: ko.observable(total_downloads),
						newly_updated: ko.observable(false),
						allow_uninstall: ko.computed(function() { return false;}), //TODO
						data: {
							content_id: "",
							store_id: "",
							display_name: selectedContent.length + " items selected",
							description: "(Multiple items selected)",
							author: "Multiple authors",
							url: true, //TODO: Check at least 1 does
							version: "",
							date: "",
							enabled: ko.observable(false)
						}
					}
				}
			},
			deferEvaluation: true
		})
	}

	model.content.selected_local_content_data(model.content.getSelectedContentStructure(true));
	model.content.selected_online_content_data(model.content.getSelectedContentStructure(false));
}