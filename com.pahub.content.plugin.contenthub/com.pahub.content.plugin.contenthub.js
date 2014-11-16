/** CORE-CONTENT **/

function load_plugin_content(data, folder) {
	model["content"] = {
		content_stores: ko.observableArray(),
		local_content_items: ko.observableArray(),
		online_content_items: ko.observableArray(),
		
		fixVersionString: function(version) {
			var components = version.split(".");
			var major = 0;
			var minor = 0;
			var revision = 0;
			var tag = "";
			if(components.length > 0) {
				major = parseInt(components[0]) || 0;
			}
			if(components.length > 1) {
				minor = parseInt(components[1]) || 0;
			}
			if(components.length > 2) {
				var tag_components = components[2].split("-");
				if(tag_components.length > 0) {
					revision = parseInt(tag_components[0]) || 0;
				}
				if(tag_components.length > 1) {
					tag = tag_components[1];
				}
			}
			return major + "." + minor + "." + revision + (tag != "" ? "-" + tag : "");
		},
		
		showContentInformation: function(local, content_id) {

			if (content_id == null) {
				if (local == true) {
					ko.cleanNode(document.getElementById("content-detail-local"));
					$("#content-detail-local").html("");
				} else {
					ko.cleanNode(document.getElementById("content-detail-online"));
					$("#content-detail-online").html("");
				}
			} else {
				if (model.content.contentItemExists(local, content_id) == true) {
					var content = pahub.api.content.getContentItem(local, content_id);
					var html = "";
					if (content.local == true) {
						if (content.store.data.hasOwnProperty("custom_local_content_info_func") == true) {
							if (typeof window[content.store.data.custom_local_content_info_func] === 'function') {
								html = window[content.store.data.custom_local_content_info_func](local, content_id);
							}
						} else {
							//TODO: News link
							//TODO: Enabled checkbox next to enable/disbale button
							html = 
								"<!-- ko with: model.content.selected_local_content_data() -->" +
								"<div class='content-detail' data-bind=\"css: {'content-disabled': !data.enabled(), 'content-update-available': typeof online_content() === 'object' ? version() != online_content().version() : false}\">" +
									"<div class='content-item' data-bind='style: {border: \"2px solid rgba(\" + (store ? $data.store.data.content_colour[0] : 255) + \",\" + (store ? $data.store.data.content_colour[1] : 255) + \",\" + (store ? $data.store.data.content_colour[2] : 255) + \",\" + (data.enabled() ? 1.0 : 0.25) + \")\"}'>" +
										"<img class='content-image' alt='' title='' data-bind=\"attr : { src : $data.icon() }\"/>" +
									"</div>" +
									"<div class='content-detail-item'>" +
										"<div class='content-downloads'>" +
											"<div><img src=\"assets/img/download.png\"/></div>" +
											"<div class='content-downloads-value' data-bind='text: downloads()'></div>" +
										"</div>" +
										"<div class='content-name' data-bind='text: display_name()'></div>" +
										"<!-- ko if: newly_updated() -->" +
											"<div class='content-new' data-bind='text: \"NEW!\"'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: store -->" +
											"<div class='content-type' data-bind='text: store.data.content_name, style: {color: \"rgba(\" + $data.store.data.content_colour[0] + \",\" + $data.store.data.content_colour[1] + \",\" + $data.store.data.content_colour[2] + \",1.0)\"}'></div>" +
											"<div class='content-author' data-bind='text: \"by \" + data.author'></div>" +
										"<!-- /ko -->" +
										"<!-- ko ifnot: store -->" +
											"<div class='content-author' data-bind='text: data.author' style='clear: left'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.version -->" +
											"<div class='content-version' data-bind='text: \"Version: v\" + version()'></div>" +
										"<!-- /ko -->" +
										"<!-- ko ifnot: data.version -->" +
											"<div class='content-version'>&nbsp;</div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.build -->" +
											"<div class='content-build' data-bind='text: \", Build \" + data.build'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.date -->" +
											"<div class='content-date' data-bind='text: \"(\" + data.date + \")\"'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.required -->" +
											"<div class='content-required' data-bind='text: \"Requires: \"'></div>" +
											"<!-- ko foreach: required_array -->" +
												"<div class='content-required-item' data-bind='text: ($index() > 0 ? \", \" : \"\") + pahub.api.content.getContentName(content_id, true)'></div>" +
												"<div class='content-required-item-condition' data-bind='text: \"(\" + condition + \")\"'></div>" +
											"<!-- /ko -->" +
										"<!-- /ko -->" +
										"<div class='content-actions'>" +
											"<!-- ko if: model.content.selected_local_content().length == 1 -->" +
												// FIXME: Don't include the logic here, add a function
												// FIXME: First check there are news items.
												"<!-- ko if: pahub.api.content.contentItemExists(true, \"com.pahub.content.plugin.community\") == true && pahub.api.content.getContentItem(true, \"com.pahub.content.plugin.community\").data.enabled() == true -->" +
													"<div class=\"text-button\" data-bind='click: function() {pahub.api.news.setFilter(content_id); pahub.api.section.setActiveSection(\"section-community\"); pahub.api.tab.setActiveTab(\"news\"); model.news.show_add(false)}'>News</div>" +
												"<!-- /ko -->" +
												"<!-- ko if: data.forum -->" +
													"<div class='text-button' data-bind='click: function() {shell.openExternal(data.forum)}'>Forum</div>" +
												"<!-- /ko -->" +
												"<div class='text-button' data-bind='click: function() {pahub.api.content.setContentEnabled($data, !(data.enabled()));}, text: data.enabled() ? \"Disable\" : \"Enable\"'></div>" +
												"<!-- ko if: online_content() && online_content().data.url -->" +
													"<!-- ko if: semver.gt(online_content().version(), version()) -->" +
														"<div class='text-button-update text-button' data-bind='click: function() {pahub.api.content.installContentItem(data.content_id)}'>Update</div>" +
													"<!-- /ko -->" +
													"<!-- ko ifnot: semver.gt(online_content().version(), version()) -->" +
														"<div class='text-button' data-bind='click: function() {pahub.api.content.installContentItem(data.content_id)}'>Reinstall</div>" +
													"<!-- /ko -->" +
												"<!-- /ko -->" +
												"<!-- ko if: model.isCorePlugin(data.content_id) == false -->" +
													"<div class='text-button-uninstall text-button' data-bind='click: function() {alert(\"Not Yet Implemented\")}'>Uninstall</div>" +
												"<!-- /ko -->" +
											"<!-- /ko -->" +
											"<!-- ko ifnot: model.content.selected_local_content().length == 1 -->" +
												"<div class='text-button' data-bind='click: function() {}'>Enable All</div>" +
												"<div class='text-button' data-bind='click: function() {}'>Disable All</div>" +
												"<div class='text-button' data-bind='click: function() {}'>Reinstall All</div>" +
												"<div class='text-button-uninstall text-button' data-bind='click: function() {alert(\"Not Yet Implemented\")}'>Uninstall All</div>" +
											"<!-- /ko -->" +
										"</div>" +
										"<div class='content-description' data-bind='text: data.description'></div>" +
									"</div>" +
								"</div>" +
								"<!-- /ko -->";
						}
						
						ko.cleanNode(document.getElementById("content-detail-local"));
						$("#content-detail-local").html(html);
						ko.applyBindings(model, document.getElementById("content-detail-local"));
					} else {
						if (content.store.data.hasOwnProperty("custom_online_content_info_func") == true) {
							if (typeof window[content.store.data.custom_online_content_info_func] === 'function') {
								html = window[content.store.data.custom_online_content_info_func](content_item);
							}
						} else {
							html = 
								"<!-- ko with: model.content.selected_online_content_data() -->" +
								"<div class='content-detail' data-bind=\"css: {'content-update-available': typeof local_content() === 'object' ? version() != local_content().version() : false}\">" +
									"<div class='content-item' data-bind='style: {border: \"2px solid rgba(\" + (store ? $data.store.data.content_colour[0] : 255) + \",\" + (store ? $data.store.data.content_colour[1] : 255) + \",\" + (store ? $data.store.data.content_colour[2] : 255) + \",1.0)\"}'>" +
										"<img class='content-image' alt='' title='' data-bind=\"attr : { src : $data.icon() }\"/>" +
									"</div>" +
									"<div class='content-detail-item'>" +
										"<div class='content-downloads'>" +
											"<div><img src=\"assets/img/download.png\"/></div>" +
											"<div class='content-downloads-value' data-bind='text: downloads()'></div>" +
										"</div>" +
										"<div class='content-name' data-bind='text: display_name()'></div>" +
										"<!-- ko if: newly_updated() -->" +
											"<div class='content-new' data-bind='text: \"NEW!\"'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: store -->" +
											"<div class='content-type' data-bind='text: store.data.content_name, style: {color: \"rgba(\" + $data.store.data.content_colour[0] + \",\" + $data.store.data.content_colour[1] + \",\" + $data.store.data.content_colour[2] + \",1.0)\"}'></div>" +
											"<div class='content-author' data-bind='text: \"by \" + data.author'></div>" +
										"<!-- /ko -->" +
										"<!-- ko ifnot: store -->" +
											"<div class='content-author' data-bind='text: data.author' style='clear: left'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.version -->" +
											"<div class='content-version' data-bind='text: \"Version: v\" + version()'></div>" +
										"<!-- /ko -->" +
										"<!-- ko ifnot: data.version -->" +
											"<div class='content-version'>&nbsp;</div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.build -->" +
											"<div class='content-build' data-bind='text: \", Build \" + data.build'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.date -->" +
											"<div class='content-date' data-bind='text: \"(\" + data.date + \")\"'></div>" +
										"<!-- /ko -->" +
										"<!-- ko if: data.required -->" +
											"<div class='content-required' data-bind='text: \"Requires: \"'></div>" +
											"<!-- ko foreach: required_array -->" +
												"<div class='content-required-item' data-bind='text: ($index() > 0 ? \", \" : \"\") + pahub.api.content.getContentName(content_id, false)'></div>" +
												"<div class='content-required-item-condition' data-bind='text: \"(\" + condition + \")\"'></div>" +
											"<!-- /ko -->" +
										"<!-- /ko -->" +
										"<div class='content-actions'>" +
											"<!-- ko if: model.content.selected_online_content().length == 1 -->" +
												// FIXME: Don't include the logic here, add a function
												// FIXME: First check there are news items.
												"<!-- ko if: pahub.api.content.contentItemExists(true, \"com.pahub.content.plugin.community\") == true && pahub.api.content.getContentItem(true, \"com.pahub.content.plugin.community\").data.enabled() == true -->" +
													"<div class=\"text-button\" data-bind='click: function() {pahub.api.news.setFilter(content_id); pahub.api.section.setActiveSection(\"section-community\"); pahub.api.tab.setActiveTab(\"news\"); model.news.show_add(false)}'>News</div>" +
												"<!-- /ko -->" +
												"<!-- ko if: data.forum -->" +
													"<div class='text-button' data-bind='click: function() {shell.openExternal(data.forum)}'>Forum</div>" +
												"<!-- /ko -->" +
												"<!-- ko if: local_content() && local_content().data.url -->" +
													"<!-- ko if: semver.gt(version(), local_content().version()) -->" +
														"<div class='text-button-update text-button' data-bind='click: function() {pahub.api.content.installContentItem(data.content_id)}'>Update</div>" +
													"<!-- /ko -->" +
													"<!-- ko ifnot: semver.gt(version(), local_content().version()) -->" +
														"<div class='text-button' data-bind='click: function() {pahub.api.content.installContentItem(data.content_id)}'>Reinstall</div>" +
													"<!-- /ko -->" +
												"<!-- /ko -->" +
												"<!-- ko ifnot: local_content() && local_content().data.url -->" +
													"<div class='text-button' data-bind='click: function() {pahub.api.content.installContentItem(data.content_id)}'>Install</div>" +
												"<!-- /ko -->" +
											"<!-- /ko -->" +
											"<!-- ko ifnot: model.content.selected_online_content().length == 1 -->" +
												"<div class='text-button' data-bind='click: function() {}'>Install All</div>" +
											"<!-- /ko -->" +
										"</div>" +
										"<div class='content-description' data-bind='text: data.description'></div>" +
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
		}),
		
		content_spotlight_tab: ko.observable('recent'),
		content_spotlight_item_count: ko.observable(5),
		spotlight_content: ko.observable(),
		
		content_spotlight_recent: ko.computed({
			read: function() {
				var sort_func = function(left, right) {
					var leftDate = new Date(left.data.date);
					var rightDate = new Date(right.data.date);
					if (left.data.date == undefined) {
						return 1;
					}
					if (right.data.date == undefined) {
						return -1;
					}
					return leftDate == rightDate ? 0 : (leftDate < rightDate ? 1 : -1);
				}
			
				var sorted_content = model.content.getContentItems(false).sorted_list(sort_func)
				var filtered_content = sorted_content().splice(0,model.content.content_spotlight_item_count());
				//if (filtered_content.indexOf(model.content.spotlight_content()) == -1) {
				if (model.content.spotlight_content() == null ) {
					model.content.spotlight_content(filtered_content[0]);
				}
				return filtered_content
			},
			deferEvaluation: true
		}),
		
		content_spotlight_downloaded: ko.computed({
			read: function() {
				var sort_func = function(left, right) {
					return left.downloads() == right.downloads() ? 0 : (left.downloads() < right.downloads() ? 1 : -1);
				}
			
				var sorted_content = model.content.getContentItems(false).sorted_list(sort_func)
				var filtered_content = sorted_content().splice(0, model.content.content_spotlight_item_count());
				return filtered_content
			},
			deferEvaluation: true
		}),
		
		getTotalDownloads: ko.computed({
			read: function() {
				var	total = 0;
				var content = pahub.api.content.getContentItems(false);
				for (var i = 0; i < content.length; i++) {
					total += content[i].downloads();
				}
				return total;
			},
			deferEvaluation: true
		})
	}
	
	setup_contenthub_content();
	setup_contenthub_actions();
	setup_contenthub_selection();
	setup_contenthub_filter();
	setup_contenthub_sort();
	
	pahub.api.section.addSection("section-content", "CONTENT HUB", path.join(folder, "contenthub.png"), "sections", 20);
	pahub.api.section.addSection("section-content-download", "DOWNLOADS", path.join(folder, "download.png"), "header", 20);
	pahub.api.tab.addTab("section-content", "spotlight-content", "SPOTLIGHT", "", 10);
	pahub.api.tab.addTab("section-content", "installed-content", "LOCAL CONTENT", "", 20);
	pahub.api.tab.addTab("section-content", "find-content", "FIND CONTENT", "", 30);
	pahub.api.tab.addTab("section-content", "upload-content", "UPLOAD CONTENT", "", 40);
	pahub.api.tab.addTab("section-content-download", "active-downloads", "", "", 50);
	
	pahub.api.resource.loadResource(path.join(folder, "spotlight-content.html"), "get", {name: "HTML: spotlight-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "spotlight-content", resource.data);
	}});
	
	pahub.api.resource.loadResource(path.join(folder, "installed-content.html"), "get", {name: "HTML: installed-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "installed-content", resource.data);
	}});
	
	pahub.api.resource.loadResource(path.join(folder, "find-content.html"), "get", {name: "HTML: find-content", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content", "find-content", resource.data);
	}});
	
	pahub.api.resource.loadResource(path.join(folder, "active-downloads.html"), "get", {name: "HTML: active-downloads", mode: "async", success: function(resource) {
		pahub.api.tab.setTabContent("section-content-download", "active-downloads", resource.data);
	}});
	
	pahub.api.setting.addSettingGroup("contenthub", "Content Hub Settings [Debug]");
	pahub.api.setting.addSetting("contenthub", "plugin.content.local_content_sort", model.content.local_content_sort, "text", "text", "Name", "local_content_sort", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.local_content_group", model.content.local_content_group, "boolean", "checkbox", true, "local_content_group", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.local_content_sort_asc", model.content.local_content_sort_asc, "boolean", "checkbox", true, "local_content_sort_asc", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.online_content_sort", model.content.online_content_sort, "text", "text", "Name", "online_content_sort", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.online_content_group", model.content.online_content_group, "boolean", "checkbox", true, "online_content_group", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.online_content_sort_asc", model.content.online_content_sort_asc, "boolean", "checkbox", true, "online_content_sort_asc", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.content_spotlight_item_count", model.content.content_spotlight_item_count, "integer", "text", 5, "content_spotlight_item_count", null, {});
	
	pahub.api.setting.addSetting("contenthub", "plugin.content.local_content_filter_view", model.content.local_content_filter_view, "boolean", "checkbox", false, "local_content_filter_view", null, {});
	pahub.api.setting.addSetting("contenthub", "plugin.content.online_content_filter_view", model.content.online_content_filter_view, "boolean", "checkbox", false, "online_content_filter_view", null, {});
	
}

function unload_plugin_content(data) {}