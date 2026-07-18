# Astro Starter Kit: Minimal

```sh
bun create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command               | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## SEO deployment URL

Canonical URLs, `robots.txt`, and the sitemap use the `site` value in `astro.config.mjs`. Set `SITE_URL` to the public production origin when deploying to a custom domain:

```sh
SITE_URL=https://example.com bun run build
```

If `SITE_URL` is not set, builds use the current production Vercel URL.

## Contact form delivery

The project inquiry form is validated in the browser and by an Astro Action, then delivered through Web3Forms from the server. The Web3Forms access key is not included in the client bundle.

1. Create an access key for the receiving email address at [Web3Forms](https://web3forms.com/).
2. Copy `.env.example` to `.env` and replace the placeholder for local development.
3. Set `WEB3FORMS_ACCESS_KEY` in each deployed Vercel environment that should accept inquiries.

Web3Forms documents its form access key as safe for client-side forms, but this integration keeps it server-side. Do not use a Web3Forms Submissions API key here; that is a separate secret credential for reading submissions.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
