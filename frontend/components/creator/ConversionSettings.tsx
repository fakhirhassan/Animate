'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
  depthEstimation: number;
  smoothness: number;
  detailLevel: number;
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
            Apply original colors to the 3D model
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

      {/* Advanced Settings */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Advanced Settings</span>
          </div>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200"
            >
              <div className="p-4 space-y-6">
                {/* Depth Estimation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-600">Depth Estimation</Label>
                    <span className="text-sm text-gray-500">
                      {settings.depthEstimation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.depthEstimation}
                    onChange={(e) =>
                      updateSetting('depthEstimation', parseInt(e.target.value))
                    }
                    disabled={disabled}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                    Controls the perceived depth of the 3D model
                  </p>
                </div>

                {/* Smoothness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-600">Smoothness</Label>
                    <span className="text-sm text-gray-500">
                      {settings.smoothness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.smoothness}
                    onChange={(e) =>
                      updateSetting('smoothness', parseInt(e.target.value))
                    }
                    disabled={disabled}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                    Higher values create smoother surfaces
                  </p>
                </div>

                {/* Detail Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-600">Detail Level</Label>
                    <span className="text-sm text-gray-500">
                      {settings.detailLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.detailLevel}
                    onChange={(e) =>
                      updateSetting('detailLevel', parseInt(e.target.value))
                    }
                    disabled={disabled}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                    Higher values preserve more surface details
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
