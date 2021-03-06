module.exports = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-controls",
    "@storybook/addon-viewport/register",
    "@storybook/addon-actions",
  ],
  webpackFinal: async (config) => {
    config.devtool = "inline-source-map";
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
        {
          loader: require.resolve("react-docgen-typescript-loader"),
        },
      ],
    });
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};
