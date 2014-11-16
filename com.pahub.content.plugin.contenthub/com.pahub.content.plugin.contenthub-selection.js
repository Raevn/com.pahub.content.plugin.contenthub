setup_contenthub_selection = function () {
	var mc = model.content;

	mc.selected_local_content_data = ko.observable();
	mc.selected_online_content_data = ko.observable();
	mc.selected_local_content = ko.observableArray();
	mc.selected_online_content = ko.observableArray();

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
		model.content.showContentInformation(local, content_ids[0]);
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
		
		model.content.showContentInformation(local, content_id);
	}

	mc.getSelectedContentStructure = function(local) {
		return ko.computed({
			read: function() {
				var selectedContent = model.content.getSelectedContent(local)();
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
						downloads: ko.observable(0),  //TODO: Compute Total
						newly_updated: ko.observable(false),
						allow_uninstall: ko.computed(function() { return false;}), //TODO
						data: {
							content_id: "",
							store_id: "",
							display_name: selectedContent.length + " items selected",
							description: "(Multiple items selected)",
							author: "Multiple authors", //TODO: actually check this
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