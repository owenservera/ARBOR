// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/types.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/types.ts — every public shape of the language layer.
// This file is the CONTRACT between: vivim.mind (WorldModel producer),
// vivim.nlcl (compartment engine), surfaces/web (server) and the browser
// (keystroke-latency feedback). Zero imports — browser-safe by construction.

/** Risk classes mirrored from the router's manifest view (ENGINE = no declared risk). */
                                                                             

/** The 17 core-primitive command symbol families (D-217). */
                        
                                                                                                        

                                                                          

/** One routable op as the mind sees it (risk + provider come from the registry). */
                                                                                        

/** A groundable thing in the world (contact, message, rule, …). `names` are grounding aliases. */
                             
                                                                             
                                                                    
                                              
                                                                    
                                                                                         
                                                                                    
 

/** A taught word (vault ns "nlcl"): word → op. Survives plugin swaps (D-218). */
                                                                                                            

/** A director rule (vault ns "automation"). */
                           
                                                
                                         
                                    
 

/** THE grounding target — everything NCLL knows about the world it commands. */
                             
                                                              
                                                                                               
                                                                               
                 
                          
                           
                     
                                                                              
                                                                           
                                                                            
                                                           
                                                                                       
                                                                         
                                                                 
                                                                                 
                                                                              
                                                                          
                                                                              
                                                                               
 

// ---- interpretation result ----

                                                                                            

                                                                                                                 

                        
            
                                         
                                                                       
                
                                                                       
                                                                      
                                                             
 

                                                                                  

/** A filled slot on an IR — display + canonical + executable value + ranked alternatives. */
                         
                                                                            
                                                                                       
                                                                           
                    
                                                                                                
                     
                                                                             
                
                                                                                         
 

                     
                                                                                                  
                     
                                
                                                                                                 
                                                                                       
                                                             
                                                                         
                     
                                                   
 

/** Per-input-token annotation — the live underlines in the console. */
                            
                                                                     
                                                    
 

/** Effect preview: what WILL happen if executed (risk/gate come from WorldModel ops). */
                             
                                                               
                                       
 

                            
                                                                                                      

                             
                       
                                                                   
                                           
                  
              
                    
 

                                                                                                    

                                                                       

/** One pipeline stage of the trace — explainability is a feature (no clocks: N1). */
                                                              

                                 
                
                       
                      
                 
                                                 
                     
                      
                           
                         
                     
                        
                            
                  
                       
 

// ---- symbol families ----

                            
                   
                                         
                                                  
                                                                            
                     
                                                                                   
 

// ---- frames (language data — D-218) ----

                                                                       

                            
               
                 
                                                         
                                                                 
                        
                     
                                                                            
                                                                
                                                                    
 

                          
             
                  
                
                     
                                                                               
                     
                     
                                                                               
 

// ===========================================================================
// Ω13.5 — learned behavior, capabilities, focus, pending intents, visual spec
// ===========================================================================

/** Learned-behavior priors: DERIVED DATA that RANKS groundings. Never decides,
 *  never executes, never bypasses a law gate. Pure input to grounding (N1 holds:
 *  same text + world + priors + version ⇒ same interpretation). */
                              
                                                     
                                                       
                                                          
                                                           
                                                                       
 
                               
                          
                                                                  
               
                
 
                            
                                                           
                                                                  
               
                
 
/** A correction memory: the user disambiguated X → prefer Y. Deterministic tiebreak. */
                                  
                                                                    
                                                    
                                                             
                              
             
 
                                 
                                                 
                           
                            
                      
                                  
 

/** A declared capability a plugin offers (feeds capability discovery + gap registry). */
                                 
                                                                      
                                                     
                
                                                  
 

/** A recorded capability gap: the user asked for something no plugin provides yet. */
                            
             
                                               
                                                                 
                                                   
                  
                 
                                              
 

/** An attached document/file in the current focus. */
                                 
                                                 
                                         
                    
                     
             
 

/** The current session focus: what the user is working on right now. */
                            
                    
                                    
                                
                    
 

/** A pending (draft) intent: a vault-resident, editable, confirmable IR awaiting
 *  explicit user confirmation. Execution only on confirm (law-gated as always). */
                                
                                             
                                          
                                                                
                                                           
                    
                    
 

// ---- deterministic visual projection (the machine showing what it will do) ----

/** Slot card for the visual projection. */
                                 
               
                 
                  
                    
                  
                    
                     
                               
                     
 
/** Entity chip for the visual projection. */
                                   
                   
               
                
                                               
 
/** Channel picker state for the visual projection. */
                                      
                          
                                                                                        
 
/** Risk/consent badge for the visual projection. */
                                  
             
                  
                                       
                     
 
/**
 * The deterministic visual projection of an interpretation — the machine showing
 * what it will execute, BEFORE executing. A pure function of (ir, world, priors);
 * identical in browser and server (N1). This is the fast-tracked intent-exposure
 * surface for the consumer app.
 */
                             
                        
                         
                           
                     
                       
                          
                                  
                                            
                                
                            
                  
                                         
 
