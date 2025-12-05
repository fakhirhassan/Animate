"""
Quick test script to verify TripoSR integration
"""
import sys
import os
from PIL import Image
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from models.two_d_to_three_d.converter import TwoDToThreeDConverter

def test_triposr():
    """Test TripoSR integration"""
    print("=" * 50)
    print("Testing TripoSR Integration")
    print("=" * 50)
    
    # Create a simple test image (just a colored square for testing)
    print("\n1. Creating test image...")
    test_image = Image.new('RGB', (256, 256), color='blue')
    test_image_path = 'test_input.png'
    test_image.save(test_image_path)
    print(f"   Test image saved to {test_image_path}")
    
    # Initialize converter
    print("\n2. Initializing converter...")
    converter = TwoDToThreeDConverter()
    
    if not converter.initialize():
        print("   ERROR: Failed to initialize converter")
        return False
    
    print("   Converter initialized successfully")
    print(f"   Using TripoSR: {converter.use_triposr}")
    
    # Perform conversion
    print("\n3. Converting 2D to 3D...")
    result = converter.convert(
        input_path=test_image_path,
        output_path='test_output',
        output_format='obj',
        quality='low'  # Use low quality for faster testing
    )
    
    # Check results
    print("\n4. Results:")
    print(f"   Success: {result.get('success', False)}")
    
    if result['success']:
        print(f"   Output file: {result['output_path']}")
        print(f"   Format: {result['format']}")
        print(f"   Method: {result.get('method', 'unknown')}")
        print(f"   Processing time: {result.get('processing_time', 0):.2f}s")
        
        if 'metadata' in result:
            metadata = result['metadata']
            print(f"   Vertices: {metadata.get('vertex_count', 'N/A')}")
            print(f"   Faces: {metadata.get('face_count', 'N/A')}")
    else:
        print(f"   Error: {result.get('error', 'Unknown error')}")
    
    # Cleanup
    print("\n5. Cleaning up...")
    converter.cleanup()
    
    # Remove test files
    if os.path.exists(test_image_path):
        os.remove(test_image_path)
        print(f"   Removed {test_image_path}")
    
    print("\n" + "=" * 50)
    print("Test completed")
    print("=" * 50)
    
    return result['success']

if __name__ == '__main__':
    try:
        success = test_triposr()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
