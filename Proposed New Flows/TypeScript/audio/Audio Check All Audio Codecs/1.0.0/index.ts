import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check All Audio Codecs',
  description: 'Check to be sure the file is all One Audio Codec and within a bitrate.'
  + ' All audio streams will be checked.',
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
      label: 'Codec',
      name: 'codec',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'dropdown',
        options: [
          'aac',
          'ac3',
          'eac3',
          'dca',
          'dts',
          'flac',
          'mp2',
          'mp3',
          'opus',
          'truehd',
          'vorbis',
          'wav',
          'wma',
        ],
      },
      tooltip: 'Specify the codec check for',
    },
    {
      label: 'Check Bitrate',
      name: 'checkBitrate',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Toggle whether to check the bitrate of the audio codec is within a range.',
    },
    {
      label: 'Greater Than',
      name: 'greaterThan',
      type: 'number',
      defaultValue: '50000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'checkBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify lower bound.',
    },
    {
      label: 'Less Than',
      name: 'lessThan',
      type: 'number',
      defaultValue: '1000000',
      inputUI: {
        type: 'text',
        displayConditions: {
          logic: 'AND',
          sets: [
            {
              logic: 'AND',
              inputs: [
                {
                  name: 'checkBitrate',
                  value: 'true',
                  condition: '===',
                },
              ],
            },
          ],
        },
      },
      tooltip: 'Specify upper bound.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'All audio streams have the codec',
    },
    {
      number: 2,
      tooltip: 'Some audio streams do not have the codec',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const checkBitrate = Boolean(args.inputs.checkBitrate);
  const greaterThan = Number(args.inputs.greaterThan);
  const lessThan = Number(args.inputs.lessThan);
  const desiredCodec = String(args.inputs.codec);
  let allTheSame = true;

  if (args.inputFileObj.ffProbeData.streams) {
    args.inputFileObj.ffProbeData.streams.forEach((stream, index) => {
      if (stream.codec_type !== 'audio') {
        return;
      }
      let hasCodec = false;
      if (stream.codec_name === desiredCodec) {
        if (!checkBitrate) {
          hasCodec = true;
        } else {
          const ffprobeBitrate = Number(stream.bit_rate || 0);
          if (ffprobeBitrate > greaterThan && ffprobeBitrate < lessThan) {
            hasCodec = true;
          }
          const mediaInfoBitrate = Number(args.inputFileObj.mediaInfo?.track?.[index + 1]?.BitRate || 0);
          if (mediaInfoBitrate > greaterThan && mediaInfoBitrate < lessThan) {
            hasCodec = true;
          }
        }
      }
      if (!hasCodec) {
        allTheSame = false;
      }
    });
  }
  if (!allTheSame) {
    args.jobLog(`Some streams do not have codec: ${desiredCodec} ${checkBitrate ? 'with '
    + `bitrate between ${greaterThan} and ${lessThan}` : ''}`);
  }
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: allTheSame ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
