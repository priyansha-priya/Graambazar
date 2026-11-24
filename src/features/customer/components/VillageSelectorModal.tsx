import React, { useState } from 'react';
import { useVillage } from '../../../contexts/VillageContext';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MapPin, Check, Store, Navigation, Search, Loader2 } from 'lucide-react';

export interface VillageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VillageSelectorModal: React.FC<VillageSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeVillage,
    villages,
    selectedLandmark,
    selectVillage,
    setLandmark,
    detectCurrentLocation,
  } = useVillage();

  const [tempVillageId, setTempVillageId] = useState(activeVillage.id);
  const [tempLandmark, setTempLandmark] = useState(selectedLandmark);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const selectedVillageObj = villages.find((v) => v.id === tempVillageId) || villages[0];

  // Filter multiple villages by name, PIN, or district
  const filteredVillages = villages.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.hindiName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.postalCodes.some((pin) => pin.includes(searchQuery))
  );

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const detectedName = await detectCurrentLocation();
      const detected = villages.find((v) => v.name === detectedName);
      if (detected) {
        setTempVillageId(detected.id);
        if (detected.popularLandmarks.length > 0) {
          setTempLandmark(detected.popularLandmarks[0]);
        }
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    selectVillage(tempVillageId);
    setLandmark(tempLandmark);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apna Gaon Ya Location Chuniye"
      description="Aapke gaon ke anusar dhabe, kirana dukanein aur delivery charges dikhaye jayenge."
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleConfirm}>
            Confirm Location & View Stores
          </Button>
        </>
      }
    >
      <div className="space-y-5 text-left text-xs">
        {/* Detect Location Button */}
        <div className="flex items-center justify-between p-3.5 bg-[#E8F5E9] border border-[#A7F3D0] rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#218838] text-white flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#176B2C]">Auto-Detect Village Location</p>
              <p className="text-[11px] text-[#218838]">Use phone GPS to find closest village cluster</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDetectLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting...
              </span>
            ) : (
              'Locate Me'
            )}
          </Button>
        </div>

        {/* Search Input for Multiple Villages */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search village name, PIN code, or district (e.g. Rampur, 221005, Varanasi)..."
            className="w-full h-11 pl-9 pr-3 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838]"
          />
        </div>

        {/* Scalable Multi-Village Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold uppercase tracking-wider text-[#1F2937] block">
              Available Villages ({filteredVillages.length})
            </label>
            <span className="text-[#6B7280]">Select your village</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
            {filteredVillages.map((village) => {
              const isSelected = village.id === tempVillageId;
              return (
                <div
                  key={village.id}
                  onClick={() => {
                    setTempVillageId(village.id);
                    if (village.popularLandmarks.length > 0) {
                      setTempLandmark(village.popularLandmarks[0]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#218838] bg-[#E8F5E9] shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div>
                      <span className="font-bold text-sm text-[#1F2937] block">
                        {village.name}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        {village.hindiName} • {village.district}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#218838] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#CBD5E1] shrink-0" />
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span className="flex items-center gap-1 font-semibold text-[#176B2C]">
                      <Store className="w-3 h-3" />
                      {village.activeStoresCount} Stores
                    </span>
                    <span>PIN {village.postalCodes[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Village Landmarks */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
          <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
            Select Mohalla / Landmark in {selectedVillageObj.name}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedVillageObj.popularLandmarks.map((lm) => (
              <button
                key={lm}
                type="button"
                onClick={() => setTempLandmark(lm)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  tempLandmark === lm
                    ? 'bg-[#218838] text-white border-[#218838]'
                    : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F1F5F9]'
                }`}
              >
                {lm}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#6B7280] shrink-0" />
            <input
              type="text"
              value={tempLandmark}
              onChange={(e) => setTempLandmark(e.target.value)}
              placeholder="Or enter your specific tola, chowk, house or school..."
              className="w-full h-9 px-3 text-xs text-[#1F2937] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#218838]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
