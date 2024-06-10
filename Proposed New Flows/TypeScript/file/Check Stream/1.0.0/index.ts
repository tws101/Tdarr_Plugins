import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { Istreams } from '../../../../FlowHelpers/1.0.0/interfaces/synced/IFileObject';
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = ():IpluginDetails => ({
  name: 'Check Stream',
  description: 'Check if a file has a specific stream',
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
      label: 'Codec Type',
      name: 'codec',
      type: 'string',
      defaultValue: 'video',
      inputUI: {
        type: 'dropdown',
        options: [
          'video',
          'audio',
          'subtitle',
          'data',
          'all',
        ],
      },
      tooltip: 'Specify the codec to check properties for, all can be used to check all streams',
    },
    {
      label: 'Property To Check',
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: 'codec_name',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter one stream property to check. Example: codec_name Example: tags.language',
    },
    {
      label: 'Property Values',
      name: 'values',
      type: 'string',
      defaultValue: 'hevc',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Enter values of the property above to find.'
        + 'For example, if looking by codec_name, could enter ac3,aac',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'File has stream',
    },
    {
      number: 2,
      tooltip: 'File does not have stream',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const codec = String(args.inputs.codec).trim();
  const property = String(args.inputs.propertyToCheck).trim();
  const values = String(args.inputs.values).trim().split(',');
  let hasStream = false;
  let checkAll = false;
  if (codec === 'all') {
    checkAll = true;
  }
  const valuesTrimed: Array<string> = [];
  values.forEach((element) => {
    const trimedElement = element.trim();
    valuesTrimed.push(trimedElement);
  });

  if (args.inputFileObj.ffProbeData.streams) {
    args.inputFileObj.ffProbeData.streams.forEach((stream :Istreams) => {
      if (stream.codec_type === codec || checkAll) {
        let target = '';
        if (property.includes('.')) {
          const parts = property.split('.');
          target = stream[parts[0]]?.[parts[1]];
        } else {
          target = stream[property];
        }
        if (target) {
          const prop = String(target).toLowerCase();
          for (let i = 0; i < valuesTrimed.length; i += 1) {
            const val = valuesTrimed[i].toLowerCase();
            if (prop.includes(val)) {
              hasStream = true;
            }
          }
        }
      }
    });
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: hasStream ? 1 : 2,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
