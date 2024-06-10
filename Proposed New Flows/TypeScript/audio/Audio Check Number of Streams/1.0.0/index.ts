import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Audio Check Number of Streams',
  description: 'Outputs number of audio streams found.',
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
      tooltip: 'One Audio Stream',
    },
    {
      number: 2,
      tooltip: 'Two Audio Streams',
    },
    {
      number: 3,
      tooltip: 'Three Audio Streams',
    },
    {
      number: 4,
      tooltip: 'Four Audio Streams',
    },
    {
      number: 5,
      tooltip: 'Five or more Audio Streams',
    },
    {
      number: 6,
      tooltip: 'No Audio Streams Detected',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  let outputNumber = 5;

  if (args.inputFileObj.ffProbeData.streams) {
    const numberOfAudioStreams = args.inputFileObj.ffProbeData.streams.filter(
      (stream :Istreams) => stream.codec_type === 'audio',
    ).length;

    switch (numberOfAudioStreams) {
      case 0:
        outputNumber = 6;
        break;
      case 1:
        outputNumber = 1;
        break;
      case 2:
        outputNumber = 2;
        break;
      case 3:
        outputNumber = 3;
        break;
      case 4:
        outputNumber = 4;
        break;
      default:
        outputNumber = 5;
    }
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
