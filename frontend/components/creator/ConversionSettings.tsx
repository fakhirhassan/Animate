'use client';

import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ConversionSettingsData {
  quality: 'low' | 'medium' | 'high';
  outputFormat: 'obj' | 'fbx' | 'glb';
  withTexture: boolean;
}

interface ConversionSettingsProps {
  settings: ConversionSettingsData;
  onChange: (settings: ConversionSettingsData) => void;
  disabled?: boolean;
}

export default function ConversionSettings({
  settings,
  onChange,
  disabled = false,
}: ConversionSettingsProps) {
  const updateSetting = <K extends keyof ConversionSettingsData>(
    key: K,
    value: ConversionSettingsData[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Quality Selection */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Model Quality</Label>
        <div className="grid grid-cols-3 gap-3">
          {(['low', 'medium', 'high'] as const).map((quality) => (
            <button
              key={quality}
              onClick={() => updateSetting('quality', quality)}
              disabled={disabled}
              className={`
                py-3 px-4 rounded-lg border-2 transition-all duration-200
                ${
                  settings.quality === quality
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <p className="font-medium capitalize">{quality}</p>
              <p className="text-xs text-gray-500 mt-1">
                {quality === 'low' && 'Fast processing'}
                {quality === 'medium' && 'Balanced'}
                {quality === 'high' && 'Best quality'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Output Format</Label>
        <Select
          value={settings.outputFormat}
          onValueChange={(value) =>
            updateSetting('outputFormat', value as 'obj' | 'fbx' | 'glb')
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="glb">.GLB (Recommended)</SelectItem>
            <SelectItem value="obj">.OBJ</SelectItem>
            <SelectItem value="fbx">.FBX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Texture Toggle */}
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-gray-700 font-medium">Include Texture</Label>
          <p className="text-xs text-gray-500 mt-1">
            Apply original colors to the 3D model (Note: texture baking is experimental)
          </p>
        </div>
        <button
          onClick={() => updateSetting('withTexture', !settings.withTexture)}
          disabled={disabled}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${settings.withTexture ? 'bg-blue-500' : 'bg-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
            animate={{ left: settings.withTexture ? '1.5rem' : '0.25rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}
