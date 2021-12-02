import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import LOADER_JS from './loaders/js-loader';
import LOADER_TS from './loaders/ts-loader';
import { LOADER_LESS_MODULE, LOADER_LESS } from './loaders/less-loader';
import { LOADER_SASS, LOADER_SASS_MODULE } from './loaders/sass-loader';
import LOADER_IMG from './loaders/img-loader';
import LOADER_FONT from './loaders/font-loader';
import { MiniCssExtractPlugin } from './plugins/plugin-mini-css-extract';
import CopyWebpackPlugin from 'copy-webpack-plugin';
const cwd = process.cwd();
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import customConfig from './custom.webpack.config';
import merge from 'webpack-merge';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';

// import SpeedMesuarePlugin from 'speed-measure-webpack-plugin';
// const smp = new SpeedMesuarePlugin();
interface INodeEnv {
  NODE_ENV: string;
}

export enum EnumEnvironment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
}

const getENV = (environment: INodeEnv): EnumEnvironment => {
  const DEFAULT_ENV = EnumEnvironment.PRODUCTION;
  if (environment.NODE_ENV === undefined) return DEFAULT_ENV;
  return environment.NODE_ENV as EnumEnvironment;
};

const mergeDevServerConfig = (
  devServerConfig: DevServerConfiguration = {},
): DevServerConfiguration => {
  const DEFAULT_HOST = '127.0.0.1';
  const DEFAULT_PORT = 8000;
  return {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    ...devServerConfig,
  };
};

const mergeEntryConfig = (entryConfig?: any) => {
  const DEFAULT_ENTRY_CONFIG = {
    app: path.resolve(cwd, './src/index.tsx'),
  };
  return entryConfig || DEFAULT_ENTRY_CONFIG;
};

const mergeOutputConfig = (env: EnumEnvironment) => (outputConfig?: any) => {
  const DEFAULT_OUTPUT_CONFIG = {
    path: path.resolve(cwd, './build'),
    filename: getBundledFilename(env),
  };
  return outputConfig || DEFAULT_OUTPUT_CONFIG;
};

const getBundledFilename = (env: EnumEnvironment) => {
  switch (env) {
    case EnumEnvironment.DEVELOPMENT:
      return '[name].bundle.js';
    case EnumEnvironment.PRODUCTION:
      return '[name].bundle.[chunkhash:8].js';
  }
};

const getConfigFilePath = (env: EnumEnvironment) => {
  switch (env) {
    case EnumEnvironment.DEVELOPMENT:
      return '/config/config.dev.js';
    case EnumEnvironment.PRODUCTION:
      return '/config/config.prod.js';
  }
};

const getCssExtractFileName = (env: EnumEnvironment) => {
  switch (env) {
    case EnumEnvironment.DEVELOPMENT:
      return '[name].css';
    case EnumEnvironment.PRODUCTION:
      return '[name].[chunkhash:8].css';
  }
};

const addCopyConfig = (configs: any[], copyConfig: any) => {
  if (!fs.existsSync(path.resolve(copyConfig.from))) return;
  if (fs.readdirSync(copyConfig.from).length <= 0) return;
  configs.push(copyConfig)
}

const ENV = getENV(process.env as any);

const getConfig = (ENV: EnumEnvironment) => {
  const decratorKeyForList = (key: string) => {
    return {
      addKey: (list: any[]) => {
        list.forEach((item, index) => {
          item[key] = index;
        });
      },
      removeKey: (list: any[]) => {
        list.forEach((item) => {
          delete item[key];
        });
      },
    };
  };

  const DOC_TITLE = 'title';
  const COPY_CONFIG: any[] = [];

  addCopyConfig(COPY_CONFIG, {
    from: path.resolve(cwd, 'public/imgs'),
    to: path.resolve(cwd, 'build/imgs'),
  });

  addCopyConfig(COPY_CONFIG, {
    from: path.resolve(cwd, 'public/config'),
    to: path.resolve(cwd, 'build/config'),
  });

  const CONFIG_FILE_PATH = getConfigFilePath(ENV);
  const plugins = [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: DOC_TITLE,
      configPath: CONFIG_FILE_PATH,
      template: path.resolve(cwd, './public/index.html'),
      publicPath: '/',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: getCssExtractFileName(ENV),
    }),
  ]

  if (COPY_CONFIG.length > 0) {
    plugins.push(new CopyWebpackPlugin({
      patterns: COPY_CONFIG,
    }));
  }

  const config: any = {
    entry: mergeEntryConfig(),
    output: mergeOutputConfig(ENV)(),
    plugins,
    resolve: {
      // ！important 动态配置，不必要的后缀配置不要加，出现频率高的后缀往前提
      extensions: ['.ts', '.tsx', '.js', 'jsx', '.less', '.json', '.scss', '.sass'],
      alias: {
        '@': path.resolve(cwd, './src'),
      },
    },
    module: {
      rules: [
        LOADER_JS,
        LOADER_TS,
        LOADER_LESS_MODULE,
        LOADER_LESS,
        LOADER_SASS,
        LOADER_SASS_MODULE,
        LOADER_IMG,
        LOADER_FONT,
      ],
    },
    stats: 'minimal',
    optimization: {
      minimizer: [new TerserWebpackPlugin(), new CssMinimizerWebpackPlugin()],
    },
  };

  if (ENV === EnumEnvironment.DEVELOPMENT) {
    (config as any).devServer = mergeDevServerConfig({
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      }
    });
  }

  const { addKey, removeKey } = decratorKeyForList('_key');

  // merge config
  let _config = null;
  if (typeof customConfig === 'object') {
    _config = merge({}, config, customConfig);
  } else if (typeof customConfig === 'function') {
    addKey(config.module.rules);
    _config = (customConfig as any)(config, { env: process.env });
    removeKey(config.module.rules);
    return _config;
  }
}

export default getConfig as any;
