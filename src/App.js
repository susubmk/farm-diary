/* eslint-disable no-restricted-globals */
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Search, Clock, MapPin, X, Camera, Bug, DollarSign } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('diary');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    useAutoDate: true,
    crop: '',
    workTypes: [],
    areas: [],
    weather: '',
    content: '',
    images: [],
    salesLocation: '',
    salesAmount: '',
    salesBoxes: ''
  });

  useEffect(() => {
    document.title = '참뜰리에';
  }, []);
  const workTypeOptions = ['파종', '정식', '인공수정', '물주기', '비료주기', '제초', '병해충 방제', '수확', '기타'];
  const areaOptions = ['10동', '4동', '집뒤', '집앞'];
  const salesLocations = ['광주경매장', '용암 공판장', '원예'];
  const areaColors = {
    '10동': 'bg-blue-500',
    '4동': 'bg-green-500',
    '집뒤': 'bg-purple-500',
    '집앞': 'bg-orange-500'
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'entries'), (snapshot) => {
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(entriesData);
    });
    return () => unsubscribe();
  }, []);

  const toggleWorkType = (type) => {
    setFormData(prev => ({
      ...prev,
      workTypes: prev.workTypes.includes(type)
        ? prev.workTypes.filter(t => t !== type)
        : [...prev.workTypes, type]
    }));
  };

  const toggleArea = (area) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}은(는) 5MB를 초과합니다.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            id: Date.now() + Math.random(),
            data: event.target.result,
            name: file.name
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };
  const handleSubmit = async () => {
    const finalDate = formData.useAutoDate ? new Date().toISOString().split('T')[0] : formData.date;
    if (!finalDate || !formData.crop || formData.workTypes.length === 0 || !formData.weather || !formData.content) {
      alert('날짜, 작물, 작업종류, 날씨, 내용을 입력해주세요!');
      return;
    }
    if (formData.workTypes.includes('인공수정') && formData.areas.length === 0) {
      alert('인공수정 작업은 구역을 선택해주세요!');
      return;
    }
    const entryData = { ...formData, date: finalDate, createdAt: new Date().toISOString() };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'entries', editingId), entryData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'entries'), entryData);
      }
      setFormData({
        date: new Date().toISOString().split('T')[0],
        useAutoDate: true,
        crop: '',
        workTypes: [],
        areas: [],
        weather: '',
        content: '',
        images: [],
        salesLocation: '',
        salesAmount: '',
        salesBoxes: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다!');
    }
  };

  const handleSalesSubmit = async () => {
    const finalDate = formData.useAutoDate ? new Date().toISOString().split('T')[0] : formData.date;
    if (!finalDate || !formData.crop || !formData.salesLocation || !formData.salesAmount || !formData.salesBoxes) {
      alert('모든 항목을 입력해주세요!');
      return;
    }
    const entryData = {
      ...formData,
      date: finalDate,
      workTypes: ['수확'],
      weather: '☀️ 맑음',
      content: `${formData.salesLocation}에 ${formData.salesBoxes}박스 판매 (${parseInt(formData.salesAmount).toLocaleString()}원)`,
      createdAt: new Date().toISOString()
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'entries', editingId), entryData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'entries'), entryData);
      }
      setFormData({
        date: new Date().toISOString().split('T')[0],
        useAutoDate: true,
        crop: '',
        workTypes: [],
        areas: [],
        weather: '',
        content: '',
        images: [],
        salesLocation: '',
        salesAmount: '',
        salesBoxes: ''
      });
      setShowSalesForm(false);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다!');
    }
  };

  const handleEdit = (entry) => {
    setFormData({...entry, useAutoDate: false});
    setEditingId(entry.id);
    if (entry.salesLocation && entry.salesAmount && entry.salesBoxes) {
      setShowSalesForm(true);
      setCurrentView('sales');
    } else {
      setShowForm(true);
      setCurrentView('diary');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'entries', id));
      } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다!');
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (entry.crop && entry.crop.toLowerCase().includes(searchLower)) ||
      (entry.workTypes && entry.workTypes.some(wt => wt.toLowerCase().includes(searchLower))) ||
      (entry.content && entry.content.toLowerCase().includes(searchLower)) ||
      (entry.areas && entry.areas.some(area => area.toLowerCase().includes(searchLower)))
    );
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const pollinationEntries = entries.filter(e => e.workTypes && e.workTypes.includes('인공수정'));
  const pesticideEntries = entries.filter(e => e.workTypes && e.workTypes.includes('병해충 방제'));
  const salesEntries = entries.filter(e => e.salesLocation && e.salesAmount && e.salesBoxes);

  const getSalesStats = () => {
    const stats = {};
    salesLocations.forEach(location => {
      const locationSales = salesEntries.filter(e => e.salesLocation === location);
      const totalAmount = locationSales.reduce((sum, e) => sum + parseFloat(e.salesAmount || 0), 0);
      const totalBoxes = locationSales.reduce((sum, e) => sum + parseInt(e.salesBoxes || 0), 0);
      stats[location] = { totalAmount, totalBoxes };
    });
    const grandTotalAmount = Object.values(stats).reduce((sum, s) => sum + s.totalAmount, 0);
    const grandTotalBoxes = Object.values(stats).reduce((sum, s) => sum + s.totalBoxes, 0);
    const averagePrice = grandTotalBoxes > 0 ? grandTotalAmount / grandTotalBoxes : 0;
    return { stats, grandTotalAmount, grandTotalBoxes, averagePrice };
  };

  const salesStats = getSalesStats();
  const currentYear = new Date().getFullYear();
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0) {
    daysInMonth[1] = 29;
  }

  const getEntriesByDate = (year, month, day, workType) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.filter(e => e.date === dateStr && e.workTypes && e.workTypes.includes(workType));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-800">영농일지</h1>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowSalesForm(false);
                setEditingId(null);
                setCurrentView('diary');
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  useAutoDate: true,
                  crop: '',
                  workTypes: [],
                  areas: [],
                  weather: '',
                  content: '',
                  images: [],
                  salesLocation: '',
                  salesAmount: '',
                  salesBoxes: ''
                });
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              새 일지
            </button>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setCurrentView('diary')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'diary' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Calendar className="w-5 h-5" />일지
            </button>
            <button onClick={() => setCurrentView('pollination')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'pollination' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Clock className="w-5 h-5" />수정 타임라인
              {pollinationEntries.length > 0 && <span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">{pollinationEntries.length}</span>}
            </button>
            <button onClick={() => setCurrentView('pesticide')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'pesticide' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Bug className="w-5 h-5" />방제 타임라인
              {pesticideEntries.length > 0 && <span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">{pesticideEntries.length}</span>}
            </button>
            <button onClick={() => setCurrentView('sales')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${currentView === 'sales' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <DollarSign className="w-5 h-5" />누적 판매금
              {salesEntries.length > 0 && <span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">{salesEntries.length}</span>}
            </button>
          </div>

          {currentView === 'diary' && (
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="작물, 작업, 구역, 내용 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingId ? '일지 수정' : '새 일지 작성'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜 입력 방식</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.useAutoDate} onChange={() => setFormData({...formData, useAutoDate: true})} className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">오늘 날짜 자동 입력</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!formData.useAutoDate} onChange={() => setFormData({...formData, useAutoDate: false})} className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">날짜 직접 선택</span>
                  </label>
                </div>
                {formData.useAutoDate ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                    <span className="text-green-700 font-bold text-lg">📅 {new Date().toISOString().split('T')[0]} (오늘)</span>
                  </div>
                ) : (
                  <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작물</label>
                <input type="text" value={formData.crop} onChange={(e) => setFormData({...formData, crop: e.target.value})} placeholder="예: 고추, 토마토" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">작업 종류 <span className="text-red-500">*</span></label>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {workTypeOptions.map(type => (
                      <label key={type} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${formData.workTypes.includes(type) ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-blue-300'}`}>
                        <input type="checkbox" checked={formData.workTypes.includes(type)} onChange={() => toggleWorkType(type)} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                  {formData.workTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500">선택됨:</span>
                      {formData.workTypes.map(type => (
                        <span key={type} className="inline-flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {type}
                          <button onClick={() => toggleWorkType(type)} className="hover:bg-blue-600 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">구역 {formData.workTypes.includes('인공수정') && <span className="text-red-500">*</span>}</label>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {areaOptions.map(area => (
                      <label key={area} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${formData.areas.includes(area) ? 'bg-purple-100 border-2 border-purple-500' : 'bg-white border-2 border-gray-200 hover:border-purple-300'}`}>
                        <input type="checkbox" checked={formData.areas.includes(area)} onChange={() => toggleArea(area)} className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">{area}</span>
                      </label>
                    ))}
                  </div>
                  {formData.areas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500">선택됨:</span>
                      {formData.areas.map(area => (
                        <span key={area} className="inline-flex items-center gap-1 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          <MapPin className="w-3 h-3" />{area}
                          <button onClick={() => toggleArea(area)} className="hover:bg-purple-600 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날씨</label>
                <select value={formData.weather} onChange={(e) => setFormData({...formData, weather: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">선택하세요</option>
                  <option value="☀️ 맑음">☀️ 맑음</option>
                  <option value="⛅ 흐림">⛅ 흐림</option>
                  <option value="🌧️ 비">🌧️ 비</option>
                  <option value="❄️ 눈">❄️ 눈</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">사진 선택하기</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {formData.images.map(img => (
                        <div key={img.id} className="relative group">
                          <img src={img.data} alt={img.name} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                          <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작업 내용</label>
                <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="오늘 한 작업을 자세히 기록하세요..." rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium">{editingId ? '수정 완료' : '저장하기'}</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium">취소</button>
              </div>
            </div>
          </div>
        )}
        {currentView === 'diary' && (
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '아직 작성된 일지가 없습니다!'}
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-green-700">{entry.date}</span>
                        <span className="text-2xl">{entry.weather}</span>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{entry.crop}</span>
                        {entry.workTypes && entry.workTypes.map(type => (
                          <span key={type} className={`px-3 py-1 rounded-full text-sm font-medium ${type === '인공수정' ? 'bg-pink-100 text-pink-800' : type === '병해충 방제' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{type}</span>
                        ))}
                        {entry.areas && entry.areas.map(area => (
                          <span key={area} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{area}
                          </span>
                        ))}
                        {entry.salesLocation && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />{entry.salesLocation} {parseInt(entry.salesAmount).toLocaleString()}원
                          </span>
                        )}
                        {entry.images && entry.images.length > 0 && (
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Camera className="w-3 h-3" />{entry.images.length}장
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(entry)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{entry.content}</p>
                  {entry.images && entry.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      {entry.images.map(img => (
                        <img key={img.id} src={img.data} alt={img.name} className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-500 transition" onClick={() => window.open(img.data, '_blank')} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {currentView === 'pollination' && (
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{currentYear}년 인공수정 타임라인</h2>
              <div className="flex gap-3 text-sm">
                {areaOptions.map(area => (
                  <div key={area} className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${areaColors[area]} rounded`}></div>
                    <span className="font-medium">{area}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-max">
              <div className="flex mb-2">
                <div className="w-16 text-xs font-bold text-gray-700 flex items-center justify-center border-r-2">월</div>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                  <div key={day} className="w-8 text-xs font-bold text-gray-700 text-center">{day}</div>
                ))}
              </div>
              {monthNames.map((month, monthIndex) => (
                <div key={month} className="flex border-b hover:bg-gray-50">
                  <div className="w-16 py-2 font-bold text-sm text-gray-700 flex items-center justify-center border-r-2">{month}</div>
                  {Array.from({length: 31}, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const isValidDay = day <= daysInMonth[monthIndex];
                    const pollinations = isValidDay ? getEntriesByDate(currentYear, monthIndex, day, '인공수정') : [];
                    const hasData = pollinations.length > 0;
                    return (
                      <div key={day} className={`w-8 h-10 flex items-center justify-center text-xs relative ${!isValidDay ? 'bg-gray-100' : ''}`}>
                        {hasData && (
                          <div className="absolute inset-0 flex flex-col gap-0.5 p-0.5">
                            {pollinations.map((poll, idx) => {
                              const uniqueAreas = [...new Set(poll.areas)];
                              return uniqueAreas.map((area, areaIdx) => (
                                <div key={`${idx}-${areaIdx}`} className={`h-1.5 ${areaColors[area]} rounded-sm`} title={`${poll.date} - ${area} - ${poll.crop}`}></div>
                              ));
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">💡 각 날짜의 색상 막대는 인공수정 작업을 나타냅니다.</div>
          </div>
        )}

        {currentView === 'pesticide' && (
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{currentYear}년 병해충 방제 타임라인</h2>
              <div className="flex gap-3 text-sm">
                {areaOptions.map(area => (
                  <div key={area} className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${areaColors[area]} rounded`}></div>
                    <span className="font-medium">{area}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-max">
              <div className="flex mb-2">
                <div className="w-16 text-xs font-bold text-gray-700 flex items-center justify-center border-r-2">월</div>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                  <div key={day} className="w-8 text-xs font-bold text-gray-700 text-center">{day}</div>
                ))}
              </div>
              {monthNames.map((month, monthIndex) => (
                <div key={month} className="flex border-b hover:bg-gray-50">
                  <div className="w-16 py-2 font-bold text-sm text-gray-700 flex items-center justify-center border-r-2">{month}</div>
                  {Array.from({length: 31}, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const isValidDay = day <= daysInMonth[monthIndex];
                    const pesticides = isValidDay ? getEntriesByDate(currentYear, monthIndex, day, '병해충 방제') : [];
                    const hasData = pesticides.length > 0;
                    return (
                      <div key={day} className={`w-8 h-10 flex items-center justify-center text-xs relative ${!isValidDay ? 'bg-gray-100' : ''}`}>
                        {hasData && (
                          <div className="absolute inset-0 flex flex-col gap-0.5 p-0.5">
                            {pesticides.map((pest, idx) => {
                              const uniqueAreas = [...new Set(pest.areas)];
                              return uniqueAreas.map((area, areaIdx) => (
                                <div key={`${idx}-${areaIdx}`} className={`h-1.5 ${areaColors[area]} rounded-sm`} title={`${pest.date} - ${area} - ${pest.crop}`}></div>
                              ));
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">💡 각 날짜의 색상 막대는 병해충 방제 작업을 나타냅니다.</div>
          </div>
        )}
        {currentView === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <button
                onClick={() => {
                  setShowSalesForm(!showSalesForm);
                  setEditingId(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    useAutoDate: true,
                    crop: '',
                    workTypes: [],
                    areas: [],
                    weather: '',
                    content: '',
                    images: [],
                    salesLocation: '',
                    salesAmount: '',
                    salesBoxes: ''
                  });
                }}
                className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition font-bold"
              >
                <Plus className="w-5 h-5" />새 판매 기록
              </button>
            </div>

            {showSalesForm && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                  {editingId ? '판매 기록 수정' : '새 판매 기록 작성'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">날짜 입력 방식</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formData.useAutoDate} onChange={() => setFormData({...formData, useAutoDate: true})} className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">오늘 날짜 자동 입력</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={!formData.useAutoDate} onChange={() => setFormData({...formData, useAutoDate: false})} className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">날짜 직접 선택</span>
                      </label>
                    </div>
                    {formData.useAutoDate ? (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-center">
                        <span className="text-yellow-700 font-bold text-lg">📅 {new Date().toISOString().split('T')[0]} (오늘)</span>
                      </div>
                    ) : (
                      <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작물 <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.crop} onChange={(e) => setFormData({...formData, crop: e.target.value})} placeholder="예: 고추, 토마토" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">판매처 <span className="text-red-500">*</span></label>
                      <select value={formData.salesLocation} onChange={(e) => setFormData({...formData, salesLocation: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        <option value="">선택하세요</option>
                        {salesLocations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">판매금 (원) <span className="text-red-500">*</span></label>
                      <input type="number" value={formData.salesAmount} onChange={(e) => setFormData({...formData, salesAmount: e.target.value})} placeholder="예: 150000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">박스 수량 <span className="text-red-500">*</span></label>
                      <input type="number" value={formData.salesBoxes} onChange={(e) => setFormData({...formData, salesBoxes: e.target.value})} placeholder="예: 30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                    </div>
                  </div>
                  {formData.salesAmount && formData.salesBoxes && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-gray-600">박스당 단가</div>
                      <div className="text-2xl font-bold text-blue-700">{(parseInt(formData.salesAmount) / parseInt(formData.salesBoxes)).toLocaleString(undefined, {maximumFractionDigits: 0})}원/박스</div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={handleSalesSubmit} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition font-medium">{editingId ? '수정 완료' : '저장하기'}</button>
                    <button onClick={() => { setShowSalesForm(false); setEditingId(null); }} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium">취소</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />판매 통계
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {salesLocations.map(location => (
                  <div key={location} className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-200">
                    <h3 className="font-bold text-gray-700 mb-3">{location}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">판매금:</span>
                        <span className="text-xl font-bold text-blue-700">{salesStats.stats[location].totalAmount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">박스:</span>
                        <span className="text-lg font-bold text-blue-600">{salesStats.stats[location].totalBoxes}박스</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border-2 border-green-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">총 판매금</div>
                    <div className="text-3xl font-bold text-green-700">{salesStats.grandTotalAmount.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">총 박스 수량</div>
                    <div className="text-3xl font-bold text-green-700">{salesStats.grandTotalBoxes}박스</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">박스당 평균 단가</div>
                    <div className="text-3xl font-bold text-green-700">{salesStats.averagePrice.toLocaleString(undefined, {maximumFractionDigits: 0})}원</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">판매 기록</h3>
              {salesEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">아직 판매 기록이 없습니다!</div>
              ) : (
                <div className="space-y-3">
                  {salesEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                    <div key={entry.id} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg hover:bg-yellow-100 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-yellow-800">{entry.date}</span>
                          <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">{entry.salesLocation}</span>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{entry.crop}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(entry)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">판매금: </span>
                          <span className="font-bold text-blue-700">{parseInt(entry.salesAmount).toLocaleString()}원</span>
                        </div>
                        <div>
                          <span className="text-gray-600">박스: </span>
                          <span className="font-bold text-green-700">{entry.salesBoxes}박스</span>
                        </div>
                        <div>
                          <span className="text-gray-600">단가: </span>
                          <span className="font-bold text-purple-700">{(parseInt(entry.salesAmount) / parseInt(entry.salesBoxes)).toLocaleString(undefined, {maximumFractionDigits: 0})}원/박스</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'diary' && entries.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">통계</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{entries.length}</div>
                <div className="text-sm text-gray-600">전체 일지</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-pink-700">{entries.filter(e => e.workTypes && e.workTypes.includes('인공수정')).length}</div>
                <div className="text-sm text-gray-600">인공수정</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{entries.filter(e => e.workTypes && e.workTypes.includes('병해충 방제')).length}</div>
                <div className="text-sm text-gray-600">방제</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{entries.filter(e => e.workTypes && e.workTypes.includes('수확')).length}</div>
                <div className="text-sm text-gray-600">수확</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{salesEntries.length}</div>
                <div className="text-sm text-gray-600">판매</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}