import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
import {
  IcospiredLanguages,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Audio for Unwanted Languages',
  description:
    'Make sure the file is reduced to only audio streams you want to keep.'
    + ' If there is only one audio stream. This plugin returns Output 1.',
  style: {
    borderColor: 'orange',
  },
  tags: 'audio',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Wanted Languages',
      name: 'langTags',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Choose the audio languages you want make sure you are reduced too.'
        + ' Three letter format.Seperate additional tags with commas eng,jpn,kor ',
    },
    {
      label: 'Undefined is Wanted',
      name: 'keepUndefined',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Undefined Audio Streams countes as wanted if true',
    },
    {
      label: 'Native is Wanted, Requires API keys to check this if enabled.',
      name: 'keepNative',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Native Audio Stream counts as wanted if true.',
    },
    {
      label: 'Priority, Check Radarr or Sonarr First',
      name: 'priority',
      type: 'string',
      defaultValue: 'Radarr',
      inputUI: {
        type: 'dropdown',
        options: [
          'Radarr',
          'Sonarr',
        ],
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify the audio bitrate for newly added channels',
    },
    {
      label: 'TMDB api key, It is recomended to add this under Tools Global Variables as api_key',
      name: 'api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your TMDB api (v3) key here. (https://www.themoviedb.org/), or use api_key as a global variable.',
    },
    {
      label: 'Radarr api key, It is recomended to add this under Tools Global Variables as radarr_api_key',
      name: 'radarr_api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.radarr_api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your Radarr api key here, or use radarr_api_key as a global variable.',
    },
    {
      label: 'Radarr FULL url, It is recomended to add this under Tools Global Variables as radarr_url',
      name: 'radarr_url',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.radarr_url}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Input your Radarr url here. (With the http://), do include the port,'
        + ' or use radarr_url as a global variable.',
    },
    {
      label: 'Sonarr api key, It is recomended to add this under Tools Global Variables as sonarr_api_key',
      name: 'sonarr_api_key',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.sonarr_api_key}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Input your Sonarr api key here, or use sonarr_api_key as a global variable.',
    },
    {
      label: 'Sonarr FULL url, It is recomended to add this under Tools Global Variables as sonarr_url',
      name: 'sonarr_url',
      type: 'string',
      defaultValue: '{{{args.userVariables.global.sonarr_url}}}',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'keepNative',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip:
        'Input your Sonarr url here. (With the http://), do include the port,'
        + ' or use sonarr_url as a global variable.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has ONLY audio that is wanted',
    },
    {
      number: 2,
      tooltip: 'File has unwanted audio',
    },
  ],
});

interface Ibody {
  movie: {
    imdbId: string,
  }
  series: {
    imdbId: string,
  }
}
interface IarrResult {
  imdbId: string,
  originalLanguage?: {
    name?: string,
  }
}
interface ItmdbResult {
  original_language: string,
}

const tmdbApi = async (filename :string, api_key :string, args :IpluginInputArgs) => {
  let fileName = '';
  // If filename begins with tt, it's already an imdb id
  if (filename) {
    if (filename.slice(0, 2) === 'tt') {
      fileName = filename;
    } else {
      const idRegex = /(tt\d{7,8})/;
      const fileMatch = filename.match(idRegex);
      // eslint-disable-next-line prefer-destructuring
      if (fileMatch) fileName = fileMatch[1];
    }
  }
  if (fileName) {
    const result :null|ItmdbResult = await args.deps.axios
      .get(
        `https://api.themoviedb.org/3/find/${fileName}?api_key=`
        + `${api_key}&language=en-US&external_source=imdb_id`,
      )
      .then((resp :unknown) => {
        if (resp && typeof resp === 'object' && 'data' in resp
          && resp.data && typeof resp.data === 'object'
        ) {
          if ('movie_results' in resp.data && resp.data.movie_results && Array.isArray(resp.data.movie_results)) {
            if (resp.data.movie_results.length > 0) {
              return resp.data.movie_results[0];
            }
            if ('tv_results' in resp.data && resp.data.tv_results && Array.isArray(resp.data.tv_results)) {
              return resp.data.tv_results[0];
            }
          }
        }
        return null;
      });
    if (!result) {
      return null;
    }
    return result;
  }
  return null;
};

const parseArrResponse = (body :Ibody, arr :string) => {
  switch (arr) {
    case 'radarr':
      return body.movie;
    case 'sonarr':
      return body.series;
    default:
      throw new Error('This should never happen');
  }
};
const tmdbFetchResult = async (args :IpluginInputArgs, languages :IcospiredLanguages) => {
  const priority = String(args.inputs.priority);
  const api_key = String(args.inputs.api_key);
  const radarr_api_key = String(args.inputs.radarr_api_key);
  const radarr_url = String(args.inputs.radarr_url);
  const sonarr_api_key = String(args.inputs.sonarr_api_key);
  const sonarr_url = String(args.inputs.sonarr_url);
  let tmdbResult :null|ItmdbResult = null;
  let prio = ['radarr', 'sonarr'];
  if (priority === 'sonarr') {
    prio = ['sonarr', 'radarr'];
  }
  let radarrResult :null|IarrResult = null;
  let sonarrResult :null|IarrResult = null;
  if (args.inputFileObj.meta?.FileName) {
    const fileNameEncoded = encodeURIComponent(args.inputFileObj.meta.FileName);
    // eslint-disable-next-line no-restricted-syntax
    for (const arr of prio) {
      let imdbId = '';
      switch (arr) {
        case 'radarr':
          if (tmdbResult) break;
          if (radarr_api_key) {
            radarrResult = parseArrResponse(
              // eslint-disable-next-line no-await-in-loop
              await args.deps.axios
                .get(
                  `${radarr_url}/api/v3/parse?apikey=${radarr_api_key}&title=${fileNameEncoded}`,
                ).then((resp :unknown) => {
                  if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
                    return resp.data;
                  }
                  return null;
                }),
              'radarr',
            );
            if (radarrResult) {
              imdbId = radarrResult.imdbId;
              args.jobLog(`Grabbed ID (${imdbId}) from Radarr `);
              if (radarrResult.originalLanguage?.name && typeof radarrResult.originalLanguage.name === 'string') {
                const result = String(languages.getAlpha2Code(radarrResult.originalLanguage.name, 'en'));
                tmdbResult = { original_language: result };
              }
            }
          }
          break;
        case 'sonarr':
          if (tmdbResult) break;
          if (sonarr_api_key) {
            sonarrResult = parseArrResponse(
              // eslint-disable-next-line no-await-in-loop
              await args.deps.axios.get(
                `${sonarr_url}/api/v3/parse?apikey=${sonarr_api_key}&title=${fileNameEncoded}`,
              ).then((resp :unknown) => {
                if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
                  return resp.data;
                }
                return null;
              }),
              'sonarr',
            );
            if (sonarrResult) {
              imdbId = sonarrResult.imdbId;
              args.jobLog(`Grabbed ID (${imdbId}) from Sonarr `);
            } else {
              imdbId = fileNameEncoded;
            }
            // eslint-disable-next-line no-await-in-loop
            tmdbResult = await tmdbApi(imdbId, api_key, args);
          }
          break;
        default:
          throw new Error('This should never happen');
      }
    }
    if (tmdbResult) {
      return tmdbResult;
    }
    args.jobLog('Couldn\'t find the IMDB id of this file. I do not know what the native language is.');
  }
  return null;
};

const findNumberOfAudioStream = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    const number = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;
    return number;
  }
  return 0;
};
// eslint-disable-next-line @typescript-eslint/ban-types
const loopOverStreamsOfType = (args:IpluginInputArgs, type :string, method :Function) => {
  if (args.inputFileObj.ffProbeData.streams) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
      if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === type) {
        method(args.inputFileObj.ffProbeData.streams[i]);
      }
    }
  }
};
const refineLangTags = (languages :IcospiredLanguages, langTags: string[]) => {
  const master = langTags;
  langTags.forEach((element) => {
    const lang = String(languages.alpha3BToAlpha2(element));
    master.push(lang);
  });
  return master;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const dependencies = ['@cospired/i18n-iso-languages'];
  await args.installClassicPluginDeps(dependencies);
  // eslint-disable-next-line import/no-unresolved
  const languages :IcospiredLanguages = require('@cospired/i18n-iso-languages');
  let meetsCondition = true;
  const keepUndefined = Boolean(args.inputs.keepUndefined);
  const keepNative = Boolean(args.inputs.keepNative);
  const langTagsUnTrimmed = String(args.inputs.langTags).toLowerCase().split(',');
  const langTags: Array<string> = [];
  const nativeLang: Array<string> = [];
  let nativeLangBool = false;
  const numberOfAudioStreams = Number(findNumberOfAudioStream(args));

  if (numberOfAudioStreams === 1) {
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: meetsCondition ? 1 : 2,
      variables: args.variables,
    };
  }

  langTagsUnTrimmed.forEach((element) => {
    const trimedElement = element.trim();
    langTags.push(trimedElement);
  });

  const langTagsMaster = refineLangTags(languages, langTags);

  if (keepNative) {
    if (args.inputFileObj.ffProbeData.streams) {
      const tmdbResult = await tmdbFetchResult(args, languages);
      if (tmdbResult) {
        const langsA2 = tmdbResult.original_language === 'cn' ? 'zh' : tmdbResult.original_language;
        const originalLang = (languages.alpha2ToAlpha3B(langsA2));
        if (originalLang && typeof originalLang === 'string') {
          nativeLang.push(originalLang);
          nativeLang.push(langsA2);
          nativeLangBool = true;
          args.jobLog(`Found ${langsA2} using code ${nativeLang}`);
        }
      }
    }
  }

  const audioStreamCheck = (stream :Istreams) => {
    if (keepUndefined) {
      if ((!stream.tags || !stream.tags.language || stream.tags.language.toLowerCase().includes('und'))) {
        return;
      }
    }
    if (stream.tags && stream.tags.language && langTagsMaster.includes(stream.tags.language.toLowerCase())) {
      return;
    }
    if (nativeLangBool) {
      if (stream.tags && stream.tags.language && nativeLang.includes(stream.tags.language.toLowerCase())) {
        return;
      }
    }
    meetsCondition = false;
  };

  loopOverStreamsOfType(args, 'audio', audioStreamCheck);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: meetsCondition ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
