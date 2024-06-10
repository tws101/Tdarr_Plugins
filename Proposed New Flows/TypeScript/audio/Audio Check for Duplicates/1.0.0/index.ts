import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Audio Check for Duplicates',
  description: 'Check the audio streams for duplicates of any language',
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
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has duplicates',
    },
    {
      number: 2,
      tooltip: 'File does not duplicates',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  let meetsCondition = false;

  if (args.inputFileObj.ffProbeData.streams) {
    const numberOfAudioStreams = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;

    if (numberOfAudioStreams >= 2) {
      const audioStreams = args.inputFileObj.ffProbeData.streams.filter((stream) => {
        if (stream.codec_type === 'audio') {
          return true;
        } return false;
      });

      const tag: Array<string> = [];

      audioStreams.forEach((stream) => {
        let lang = '';
        if (stream.tags !== undefined) {
          if (stream.tags.language !== undefined) {
            lang = stream.tags.language.toLowerCase();
          } else {
            lang = 'und';
          }
        } else {
          lang = 'und';
        }
        tag.push(lang);
      });

      const duplicates = tag.filter((item, index) => tag.indexOf(item) !== index);
      if (duplicates.length >= 1) {
        meetsCondition = true;
      }
    }
  }

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
