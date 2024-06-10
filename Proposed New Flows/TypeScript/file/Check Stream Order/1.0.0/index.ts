import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Stream Order',
  description: 'Check if the streams are in order. Video, Audio by channel count lowest to highest, subtitles, other',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Audio Highest to Lowest. Set to true if you want Highest to Lowest.',
      name: 'reverseAudio',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Use this to check audio highest channel to lowest',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'In Order',
    },
    {
      number: 2,
      tooltip: 'Out of Order',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const reverse = Boolean(args.inputs.reverseAudio);
  let inOrder = true;
  let audioIdx = 0;
  let audio1Idx = 0;
  let audio2Idx = 0;
  let audio6Idx = 0;
  let audio8Idx = 0;
  let subtitleIdx = 0;

  if (args.inputFileObj.ffProbeData.streams) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
      if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
        if (audioIdx !== 0 || subtitleIdx !== 0) {
          inOrder = false;
        }
      }
      if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === 'audio') {
        if (subtitleIdx !== 0) {
          inOrder = false;
        }
        audioIdx += 1;
        if (reverse) {
          if (args.inputFileObj.ffProbeData.streams[i].channels === 8) {
            if (audio6Idx !== 0 || audio2Idx !== 0 || audio1Idx !== 0) {
              inOrder = false;
            }
            audio8Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 6) {
            if (audio2Idx !== 0 || audio1Idx !== 0) {
              inOrder = false;
            }
            audio6Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 2) {
            if (audio1Idx !== 0) {
              inOrder = false;
            }
            audio2Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 1) {
            audio1Idx += 1;
          }
        } else {
          if (args.inputFileObj.ffProbeData.streams[i].channels === 1) {
            if (audio2Idx !== 0 || audio6Idx !== 0 || audio8Idx !== 0) {
              inOrder = false;
            }
            audio1Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 2) {
            if (audio6Idx !== 0 || audio8Idx !== 0) {
              inOrder = false;
            }
            audio2Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 6) {
            if (audio8Idx !== 0) {
              inOrder = false;
            }
            audio6Idx += 1;
          }
          if (args.inputFileObj.ffProbeData.streams[i].channels === 8) {
            audio8Idx += 1;
          }
        }
      }
      if (args.inputFileObj.ffProbeData.streams[i].codec_type.toLowerCase() === 'subtitle') {
        subtitleIdx += 1;
      }
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: inOrder ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
