(function(){
  if(!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) return;
  if(typeof window.Capacitor.registerPlugin!=="function") return;

  var NativeBarcode=window.Capacitor.registerPlugin("CapacitorBarcodeScanner");
  var originalOpen=window.openFullscreenScanner;
  var nativeBusy=false;

  function isCancelError(e){
    var s=String((e&&e.message)||e||"").toLowerCase();
    return s.indexOf("cancel")>=0 || s.indexOf("canceled")>=0 || s.indexOf("cancelled")>=0;
  }

  async function nativeOpenBarcodeScanner(target){
    if(nativeBusy)return;
    nativeBusy=true;
    var slot=target||null;
    try{
      if(typeof window.stopScanner==="function") await window.stopScanner();
      if(typeof window.goPage==="function") window.goPage("scan");
      if(typeof window.openPanel==="function") window.openPanel("barcode");
      if(typeof window.clearError==="function") window.clearError();
      if(typeof window.setStatus==="function") window.setStatus("Android-Scanner wird gestartet …");
      if(typeof window.diagV70==="function") window.diagV70("native_barcode_start",{slot:slot||""});

      var result=await NativeBarcode.scanBarcode({
        hint:17,
        scanInstructions:"Barcode ruhig in den Rahmen halten",
        scanButton:false,
        scanText:"",
        cameraDirection:1,
        scanOrientation:3,
        cancelButtonAccessibilityLabel:"Scanner schließen",
        torchButtonOnAccessibilityLabel:"Licht ausschalten",
        torchButtonOffAccessibilityLabel:"Licht einschalten",
        android:{scanningLibrary:"mlkit"}
      });

      var code=String(result&&result.ScanResult||"").replace(/\D/g,"");
      if(!code){
        if(typeof window.setStatus==="function") window.setStatus("Kein Barcode erkannt.");
        return;
      }
      if(code.length<8||code.length>14){
        if(typeof window.setStatus==="function") window.setStatus("Der erkannte Code ist kein Produktbarcode.");
        return;
      }
      if(typeof window.validGtinChecksumV64==="function" && !window.validGtinChecksumV64(code)){
        if(typeof window.setStatus==="function") window.setStatus("Barcode war nicht eindeutig. Bitte noch einmal scannen.");
        return;
      }

      var input=document.getElementById("barcodeInput");
      if(input)input.value=code;
      try{if(navigator.vibrate)navigator.vibrate([80,40,80])}catch(e){}
      if(typeof window.diagV70==="function") window.diagV70("native_barcode_ok",{length:code.length,slot:slot||""});
      if(typeof window.setStatus==="function") window.setStatus("✓ Barcode erkannt: "+code);

      if(slot && typeof window.lookupCompareProduct==="function"){
        await window.lookupCompareProduct(code,slot);
      }else if(typeof window.lookupBarcode==="function"){
        await window.lookupBarcode(code,true);
      }
    }catch(e){
      if(typeof window.diagV70==="function") window.diagV70("native_barcode_error",{message:String((e&&e.message)||e||"").slice(0,100)});
      if(isCancelError(e)){
        if(typeof window.setStatus==="function") window.setStatus("Scan abgebrochen.");
      }else{
        if(typeof window.setStatus==="function") window.setStatus("Nativer Scanner konnte nicht gestartet werden – Web-Scanner wird verwendet.");
        nativeBusy=false;
        if(typeof originalOpen==="function") return originalOpen(slot);
      }
    }finally{
      nativeBusy=false;
    }
  }

  window.openFullscreenScanner=nativeOpenBarcodeScanner;
  window.openCompareScanner=function(slot){return nativeOpenBarcodeScanner(slot)};
  window.ECheckNativeBarcode={scan:nativeOpenBarcodeScanner};
})();