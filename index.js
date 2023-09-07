const axios = require("axios");
const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_KEY });

let aniArray = [];

function getAnime(name) {
  const query = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
        }
        media(search: $search, type: ANIME, sort: FAVOURITES_DESC) {
          id
          title {
            romaji
            english
            native
          }
          type
          genres
          status
          episodes
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    }
  `;

  let variables = {
    search: name,
    page: 1,
    perPage: 1,
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  return axios.post("https://graphql.anilist.co", {
    query,
    variables,
    headers,
  })
  .then((anime) => {
    const animeInfo = anime.data["data"]["Page"]["media"][0];

    const aniData = {
      name: animeInfo.title.english,
      type: animeInfo.type,
      genres: animeInfo.genres,
      status: animeInfo.status,
      nextep: animeInfo.nextAiringEpisode ? new Date(animeInfo.nextAiringEpisode.airingAt * 1000) : null,
    };
    aniArray.push(aniData);
    console.log(aniArray);
  })
  .catch((error) => {
    console.log(error);
  });
}

async function createNotionPage() {
  for (let anime of aniArray) {
    const properties = {
      Name: {
        title: [
          {
            type: "text",
            text: {
              content: anime.name,
            },
          },
        ],
      },
    };
    if (anime.nextep) {
      properties["Date"] = { date: { start: anime.nextep } };
    }
    const response = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.NOTION_DATABASE_ID,
      },
      properties,
    });
  }
}

getAnime("hells paradise")
  .then(() => {
    // createNotionPage(); //uncomment if want to use this
  });
