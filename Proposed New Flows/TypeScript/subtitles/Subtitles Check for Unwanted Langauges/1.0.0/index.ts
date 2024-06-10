import {
  IcospiredLanguages,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Subtitles for Unwanted Languages',
  description: 'Make sure the file is reduced to only subtitles of the chosen language',
  style: {
    borderColor: 'orange',
  },
  tags: 'subtitles',
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
        'Choose the subtitles languages you want make sure you are reduced too in Three letter format.'
        + 'Seperate additional tags with commas eng,jpn,kor ',
    },
    {
      label: 'Undefined is Wanted',
      name: 'keepUndefined',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Undefined Sub Streams countes as wanted if true',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has ONLY subtitles of the chosen language',
    },
    {
      number: 2,
      tooltip: 'File has unwanted subtitles',
    },
  ],
});

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
    const lang = languages.alpha3BToAlpha2(element);
    if (lang && typeof lang === 'string') {
      master.push(lang);
    }
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
  const langTagsUnTrimmed = String(args.inputs.langTags).toLowerCase().split(',');
  const langTags: Array<string> = [];
  langTagsUnTrimmed.forEach((element) => {
    const trimedElement = element.trim();
    langTags.push(trimedElement);
  });

  const langTagsMaster = refineLangTags(languages, langTags);

  const subProcess = (stream :Istreams) => {
    if (keepUndefined) {
      if ((!stream.tags || !stream.tags.language || stream.tags.language.toLowerCase().includes('und'))) {
        return;
      }
    }
    if (stream.tags && stream.tags.language && langTagsMaster.includes(stream.tags.language.toLowerCase())) {
      return;
    }
    meetsCondition = false;
  };

  loopOverStreamsOfType(args, 'subtitle', subProcess);

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
