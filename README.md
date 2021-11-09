# Media Links for Reddit
Uses Reddit's public API to list all of the available direct video and image links for a user or subreddit

## Usage
1. Go to [Media Links for Reddit](https://robojafar.github.io/reddit-media-links/) site hosted on Github pages
2. Select whether to aggregate a subreddit or user
3. Enter the name of the subreddit or user
4. Choose the sorting type
5. Click Start

Note: 
- Direct links will appear after all links are captured
- Unprocessed links will appear as reddit posts

## Rate Limiting
Data hoarders, be wary: Reddit limits requests to 30 per minute. 
Selecting either top or new sort will make 10 requests for a subreddit or 20 requests for a user.
Selecting Top and New sort will make double the requests.

## Resources
The following resources were helpful in building this script:
- [Reddit API](https://www.reddit.com/dev/api/)
- [Old Reddit documentation](https://github.com/reddit-archive/reddit/wiki)
- [Reddit Dev Subreddit](https://www.reddit.com/r/redditdev/)
- [Gfycat API](https://developers.gfycat.com/api/#getting-gfycats)
- [Redgifs API](https://github.com/Redgifs/api/wiki)
