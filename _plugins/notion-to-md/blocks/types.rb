module NotionToMd
  module Blocks
    class Types
      class << self
        # custom video block for use with chirpy
        def video(block)
          case block.external.url
          when /youtube/
            params = URI(block.external.url).query
            youtube_id = params.split("=")[1]
            "{% include embed/youtube.html id='#{youtube_id}' %}"

          when /youtu.be/
            params = URI(block.external.url).query
            puts params
            youtube_id = params.split("/")[1]
            "{% include embed/youtube.html id='#{youtube_id}' %}"
          end
        end

        def image(block)

        end

      end
    end
  end
end
