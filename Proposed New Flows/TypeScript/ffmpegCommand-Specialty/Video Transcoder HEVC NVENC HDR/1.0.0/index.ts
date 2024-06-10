import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = () :IpluginDetails => ({
  name: 'Video Encoder HEVC NVENC',
  description: 'Transcodes video to HEVC via NVENC hardware, pixel output is 10-bit.'
  + ' HDR if present will be output as HDR 10.'
  + ' It is not recomended to use any other video arguments with this plugin.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'FFmpeg Preset',
      name: 'ffmpegPreset',
      type: 'string',
      defaultValue: 'fast',
      inputUI: {
        type: 'dropdown',
        options: [
          'veryslow',
          'slower',
          'slow',
          'medium',
          'fast',
          'faster',
          'veryfast',
          'superfast',
          'ultrafast',
        ],
      },
      tooltip: 'Specify ffmpeg preset',
    },
    {
      label: 'Constant Quality',
      name: 'cq',
      type: 'string',
      defaultValue: '25',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Choose contant quality 19 to 31, with 19 being the best.',
    },
    {
      label: 'Target Bitrate, the ideal bit rate you want.',
      name: 'bitrateTarget',
      type: 'number',
      defaultValue: '5000',
      inputUI: {
        type: 'text',
      },
      tooltip:
        'Specify target bitrate in kbps. If the file is h264 and less than this input, '
        + 'a 50 percent reduction will be targeted instead.',
    },
    {
      label: 'Max Bitrate Increase. how much the bitrate target can increase by.',
      name: 'bitrateMax',
      type: 'number',
      defaultValue: '2000',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Specify max increase to bitrate in kbps',
    },
    {
      label: 'Reconvert HEVC',
      name: 'reconvert_hevc',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Process this even if the file is HEVC already.',
    },
    {
      label: 'B Frames',
      name: 'bframes',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Set true if your GPU can do B frames.',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

const calculateBitrate = (args :IpluginInputArgs) => {
  if (args.inputFileObj.ffProbeData.streams) {
    let bitrateProbePossible = args.inputFileObj.ffProbeData.streams[0].bit_rate;
    // eslint-disable-next-line no-restricted-globals
    if (typeof bitrateProbePossible === 'undefined') {
      bitrateProbePossible = args.inputFileObj.bit_rate;
    }
    if (typeof bitrateProbePossible === 'undefined') {
      return null;
    }
    return bitrateProbePossible;
  }
  return null;
};

const videoTranscode = (args :IpluginInputArgs) => {
  const reconvert_hevc = Boolean(args.inputs.reconvert_hevc);
  const presetSpeed = String(args.inputs.ffmpegPreset);
  const cq = String(args.inputs.cq);
  const bitrateT = Number(args.inputs.bitrateTarget);
  const bFrames = Boolean(args.inputs.bframes);
  let bitrateTarget = bitrateT;
  const bitrateMaxIncrease = Number(args.inputs.bitrateMax);
  const bitrateMax = bitrateTarget + bitrateMaxIncrease;

  if (args.inputFileObj.video_codec_name === 'h264') {
    const bitrateProbePossible = calculateBitrate(args);
    if (bitrateProbePossible) {
      const bitrateProbe = (bitrateProbePossible / 1000);
      if (bitrateProbe < bitrateT) {
        bitrateTarget = (bitrateProbe * 0.5);
      }
    }
  }

  args.variables.ffmpegCommand.streams.forEach((stream) => {
    if (stream.codec_type !== 'video') {
      return;
    }
    if (!reconvert_hevc) {
      if (stream.codec_name === 'hevc' || stream.codec_name === 'vp9') {
        return;
      }
    }
    // eslint-disable-next-line no-param-reassign
    args.variables.ffmpegCommand.shouldProcess = true;
    args.jobLog('Transcoding to HEVC using NVidia NVENC');
    stream.inputArgs.push('-hwaccel', 'cuda');
    stream.outputArgs.push('-c:{outputIndex}', 'hevc_nvenc');
    stream.outputArgs.push('-qmin:{outputIndex}', '0', '-cq:{outputIndex}', cq);
    stream.outputArgs.push('-b:{outputIndex}', `${bitrateTarget}k`, '-maxrate:{outputIndex}', `${bitrateMax}k`);
    stream.outputArgs.push('-preset:{outputIndex}', presetSpeed, '-rc-lookahead:{outputIndex}', '32');
    stream.outputArgs.push('-spatial_aq:{outputIndex}', '1', '-aq-strength:{outputIndex}', '8');
    stream.outputArgs.push('-pix_fmt:{outputIndex}', 'p010le');
    if (stream.color_space === 'bt2020nc') {
      args.jobLog('HDR Detected, Using HDR 10.');
      stream.outputArgs.push('-color_primaries:{outputIndex}', 'bt2020');
      stream.outputArgs.push('-colorspace:{outputIndex}', 'bt2020nc');
      stream.outputArgs.push('-color_trc:{outputIndex}', 'smpte2084');
    }
    if (bFrames) {
      stream.outputArgs.push('-bf:{outputIndex}', '5');
    }
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  videoTranscode(args);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
