module SarMap
  module SarMap
    class ViewHooks < Redmine::Hook::ViewListener
      render_on :view_issues_show_description_bottom, :partial => 'sar_map/issue_sar_map'

      def view_layouts_base_html_head(context = {})
        if context[:controller].is_a?(IssuesController) && context[:controller].action_name == 'show'
          <<-HEAD
            #{ javascript_include_tag "https://maps.google.com/maps/api/js?key=#{Setting.plugin_sar_map[:google_api_key]}", :cache => true }
            #{ javascript_include_tag 'coordConverter', plugin: 'sar_map' }
            #{ javascript_include_tag 'sarMapManager', plugin: 'sar_map' }
            #{ javascript_include_tag 'gpxWorks', plugin: 'sar_map' }
          HEAD
        end
      end
    end
  end
end
