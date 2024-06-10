import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Subtitles Check for Commentary',
  description: 'Check the Subtitles Streams for Commentary',
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
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has subtitles commentary streams',
    },
    {
      number: 2,
      tooltip: 'File does not have subtitles commentary streams',
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

const noCommentary = (stream :Istreams) => {
  if (!stream.tags || !stream.tags.title) {
    return true;
  } if (
    stream.tags.title.toLowerCase().includes('commentary')
    || stream.tags.title.toLowerCase().includes('description')
    || stream.tags.title.toLowerCase().includes('sdh')
  ) {
    return false;
  }
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  let meetsCondition = false;

  const subProcess = (stream :Istreams) => {
    if (!noCommentary(stream)) {
      meetsCondition = true;
    }
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
