Redmine::Plugin.register :sar_map do
  name 'Sar Map plugin'
  author 'Dmitrii Monakhov'
  description 'Displays GPX track attachments in issue viewer'
  version '1.0.0'
  url 'https://db.otklik.team'
  author_url 'https://otklik.team'

  settings default: {
    google_api_key: 'api key here'
  }, partial: 'settings/sar_map_settings'  
end

require 'sar_map/view_hooks'