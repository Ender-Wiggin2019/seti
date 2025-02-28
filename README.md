# SETI Card List

This is an open-source online website of the board game SETI. It is not affiliated with CGE in any way.

See a [demo](https://seti.ender-wiggin.com/).

## Updates

This project will be updated over time.
Expect frequent improvements.

Next up:

- [ ] All aliens
- [ ] Card description translation
- [ ] Card flavor text translation
- [ ] DIY
- [ ] Alien boards

## Running Locally

**1. Clone Repo**

```bash
git clone git@github.com:Ender-Wiggin2019/seti.git
```

**2. Install Dependencies**

```bash
pnpm i
```

If you don't hav `pnpm` installed, you can install it with the following command:

```bash
npm install -g pnpm
```

**3. Set Environment Variables**

```bash
mv .env.example .env.local
```

For now, I use the following technologies:

- [Clerk](https://www.clerk.dev/) for authentication. You can sign up for a free account [here](https://www.clerk.dev/). Once you have an account, you can create a new project and get your API keys. Then, you can add them to your `.env.local` file.
- [Neon](https://neon.tech/) for database. It's not integrated yet, but will be implemented in the future.

**3. Run App**

```bash
pnpm run dev
```

## Help to Translate

If you want to provide an additional translation, you can go to the [locales](https://github.com/Ender-Wiggin2019/seti/tree/main/public/locales) folder and follow these steps:

1. Copy all `.json` files in `en` folder, and paste them in a new folder with the name of your language (e.g. `fr` for French).
2. Translate all the strings in the new files. Please note that you only need to translate the strings on the right side of the `:` character. Also, please do not change anything wrapped in `{}` and `<>`. i.e. `{Money-3}` and `<br>` should remain the same in your translation.
3. You can send a pull request with the new files, or send them to me by email (see my [GitHub profile](https://github.com/Ender-Wiggin2019)).
